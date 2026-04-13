import OpenAI from "openai";

import { saveProject } from "@/lib/project-repository";
import {
  buildCatalogSummary,
  buildTemplateFamilies,
  getTemplateKindOrder,
  normalizeParameterValue,
  normalizeTemplateSchema,
  normalizeTemplateVariants,
} from "@/lib/template-catalog";
import type {
  BookSpecOption,
  CatalogSummary,
  ContentItem,
  Estimate,
  GeneratedPage,
  GeneratedSection,
  Order,
  Project,
  ShippingInfo,
  TemplateOption,
  TemplateParameterDefinition,
  TemplateParameterValue,
  TemplateSchema,
} from "@/types/project";

const SWEETBOOK_BASE_URL =
  process.env.SWEETBOOK_API_BASE_URL ?? "https://api-sandbox.sweetbook.com/v1";

const hasSweetBookConfig = () => Boolean(process.env.SWEETBOOK_API_KEY);
const hasOpenAIConfig = () => Boolean(process.env.OPENAI_API_KEY);

type TemplateListResponse = {
  data?: {
    items?: Array<Record<string, unknown>>;
    templates?: Array<Record<string, unknown>>;
    pagination?: {
      total?: number;
    };
  };
};

type TemplateDetailResponse = {
  data?: Record<string, unknown>;
};

type TemplateSchemaCatalog = {
  variants: ReturnType<typeof normalizeTemplateVariants>;
  templates: TemplateOption[];
  summary: CatalogSummary;
  schemas: TemplateSchema[];
  message: string;
};

type TemplateCatalogData = {
  variants: ReturnType<typeof normalizeTemplateVariants>;
  templates: TemplateOption[];
  summary: CatalogSummary;
  message: string;
};

let templateCatalogPromise: Promise<TemplateCatalogData> | null = null;

const sweetBookRequest = async <T>(
  path: string,
  init?: RequestInit,
  idempotencyKey?: string,
  attempt = 0,
) => {
  const headers = new Headers(init?.headers);

  if (process.env.SWEETBOOK_API_KEY) {
    headers.set("Authorization", `Bearer ${process.env.SWEETBOOK_API_KEY}`);
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const response = await fetch(`${SWEETBOOK_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : 400 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return sweetBookRequest<T>(path, init, idempotencyKey, attempt + 1);
    }

    // Log full body so the developer can see the actual SweetBook error
    console.error(`[sweetbook] ${path} ${response.status}`, JSON.stringify(payload));
    const baseMessage = payload?.message ?? payload?.error ?? `Request failed (${response.status})`;
    const details =
      Array.isArray(payload?.errors) && payload.errors.length > 0
        ? `: ${(payload.errors as string[]).join("; ")}`
        : "";
    throw new Error(`[${path}] ${baseMessage}${details}`);
  }

  return payload as T;
};

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
) => {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const next = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => next()),
  );

  return results;
};

const fetchAllTemplateRecords = async () => {
  const records: Array<Record<string, unknown>> = [];
  let offset = 0;
  const limit = 100;
  let total: number | null = null;

  while (true) {
    const response = await sweetBookRequest<TemplateListResponse>(
      `/templates?limit=${limit}&offset=${offset}`,
    );
    const items = response.data?.items ?? response.data?.templates ?? [];

    if (typeof response.data?.pagination?.total === "number") {
      total = response.data.pagination.total;
    }

    if (items.length === 0) {
      break;
    }

    records.push(...items);

    if (items.length < limit) {
      break;
    }

    offset += limit;

    if (total !== null && records.length >= total) {
      break;
    }
  }

  return records;
};

const fetchTemplateDetailRecord = async (templateUid: string) => {
  const response = await sweetBookRequest<TemplateDetailResponse>(
    `/templates/${templateUid}`,
  );
  return response.data ?? null;
};

const ensureAbsoluteAssetUrl = (value: string) => {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${SWEETBOOK_BASE_URL.replace(/\/v1$/, "")}${value}`;
  }

  return value;
};

const toFileFromDataUrl = async (dataUrl: string, fallbackName: string) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fallbackName, {
    type: blob.type || "image/jpeg",
  });
};

const createOpenAIClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const buildTemplateCatalog = async (): Promise<TemplateCatalogData> => {
  if (!hasSweetBookConfig()) {
    throw new Error("SWEETBOOK_API_KEY is required to load the SweetBook catalog.");
  }

  const items = await fetchAllTemplateRecords();
  const variants = normalizeTemplateVariants(items);
  const templates = buildTemplateFamilies(variants);
  const summary = buildCatalogSummary(variants, templates);

  return {
    variants,
    templates,
    summary,
    message: `Loaded ${summary.totalTemplates} template schemas across ${summary.familyCount} theme families from SweetBook.`,
  };
};

const getTemplateCatalogData = async (): Promise<TemplateCatalogData> => {
  if (!templateCatalogPromise) {
    templateCatalogPromise = buildTemplateCatalog().catch((error) => {
      templateCatalogPromise = null;
      throw error;
    });
  }

  return templateCatalogPromise;
};

export const getTemplateCatalog = async (): Promise<{
  templates: TemplateOption[];
  summary: CatalogSummary;
  message: string;
}> => {
  const catalog = await getTemplateCatalogData();
  return {
    templates: catalog.templates,
    summary: catalog.summary,
    message: catalog.message,
  };
};

export const getTemplateOptions = async (): Promise<TemplateOption[]> => {
  const catalog = await getTemplateCatalog();
  return catalog.templates;
};

const extractBookSpecItems = (
  data:
    | Array<Record<string, unknown>>
    | {
        items?: Array<Record<string, unknown>>;
      }
    | undefined,
) => {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.items ?? [];
};

export const getBookSpecOptions = async (): Promise<BookSpecOption[]> => {
  if (!hasSweetBookConfig()) {
    throw new Error("SWEETBOOK_API_KEY is required to load book specs.");
  }

  const catalog = await getTemplateCatalogData();
  const supportedBookSpecIds = Array.from(
    new Set(catalog.templates.flatMap((template) => template.bookSpecIds)),
  );
  const supportedBookSpecIdSet = new Set(supportedBookSpecIds);

  const response = await sweetBookRequest<{
    data?:
      | Array<Record<string, unknown>>
      | {
          items?: Array<Record<string, unknown>>;
        };
  }>("/book-specs");

  const items = extractBookSpecItems(response.data);
  if (items.length === 0) {
    throw new Error("The SweetBook API returned no book specs.");
  }

  const bookSpecs = items
    .map((item) => ({
      id: String(item.bookSpecUid ?? item.uid ?? ""),
      name: String(item.name ?? ""),
      description: String(item.description ?? ""),
      width: Number(item.innerTrimWidthMm ?? item.width ?? 0),
      height: Number(item.innerTrimHeightMm ?? item.height ?? 0),
      minPages: Number(item.pageMin ?? item.minPages ?? 0),
      maxPages: Number(item.pageMax ?? item.maxPages ?? 0),
      pageStep: Number(item.pageIncrement ?? item.pageStep ?? 0),
    }))
    .filter(
      (bookSpec) =>
        bookSpec.id.length > 0 &&
        bookSpec.name.trim().length > 0 &&
        supportedBookSpecIdSet.has(bookSpec.id),
    );

  if (bookSpecs.length === 0) {
    throw new Error("The SweetBook API returned no supported book specs.");
  }

  return [...bookSpecs].sort(
    (left, right) =>
      supportedBookSpecIds.indexOf(left.id) - supportedBookSpecIds.indexOf(right.id),
  );
};

const formatDateRange = (date: Date) => {
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}.${month}`;
};

const formatMonthName = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long" }).format(date).toUpperCase();

const formatDateLabel = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date).toUpperCase();
  return `${day} | ${weekday}`;
};

const pointColorForMonth = (month: number) => {
  if ([3, 4, 5].includes(month)) {
    return "#FFFFA281";
  }
  if ([6, 7, 8].includes(month)) {
    return "#FF9DE3D6";
  }
  if ([9, 10, 11].includes(month)) {
    return "#FFFFB06A";
  }
  return "#FF86B7FF";
};

const buildDefaultTextValue = (
  key: string,
  project: Project,
  date: Date,
  imageIndex: number,
) => {
  if (/(title|bookTitle)$/i.test(key)) {
    return project.title;
  }
  if (/dateRange/i.test(key)) {
    return formatDateRange(date);
  }
  if (/year/i.test(key)) {
    return String(date.getFullYear());
  }
  if (/monthName/i.test(key)) {
    return formatMonthName(date);
  }
  if (/(^|_)month$/i.test(key)) {
    return String(date.getMonth() + 1);
  }
  if (/date/i.test(key)) {
    return formatDateLabel(date);
  }
  if (/schoolName/i.test(key)) {
    return "SweetBook Studio";
  }
  if (/childName/i.test(key)) {
    return "Archive";
  }
  if (/volumeLabel/i.test(key)) {
    return "Vol. 1";
  }
  if (/periodText/i.test(key)) {
    return `${date.getFullYear()}.${date.getMonth() + 1}`;
  }
  if (/pointColor/i.test(key)) {
    return pointColorForMonth(date.getMonth() + 1);
  }
  if (/comment/i.test(key)) {
    return "";
  }
  return `${project.title} ${imageIndex + 1}`;
};

const buildPageParameters = (
  project: Project,
  schema: TemplateSchema,
  mediaCursor: { value: number; coverUsed: boolean },
) => {
  const now = new Date();
  const parameters: Record<string, TemplateParameterValue> = {};
  const assignedContentItemIds: string[] = [];
  const imageItems = project.contentItems.filter(
    (item): item is ContentItem & { imageUrl: string } =>
      item.kind === "image" &&
      typeof item.imageUrl === "string" &&
      item.imageUrl.length > 0,
  );

  const takeNextImages = (count: number) => {
    if (count <= 0) {
      return [];
    }

    const nextItems = imageItems.slice(mediaCursor.value, mediaCursor.value + count);
    mediaCursor.value += nextItems.length;
    assignedContentItemIds.push(...nextItems.map((item) => item.id));
    return nextItems.map((item) => item.imageUrl);
  };

  Object.entries(schema.parameterDefinitions).forEach(([key, definition]) => {
    if (
      definition.binding === "rowGallery" ||
      definition.binding === "columnGallery"
    ) {
      const remaining = Math.max(imageItems.length - mediaCursor.value, 0);
      const desiredCount =
        typeof definition.minItems === "number" && definition.minItems > 0
          ? Math.min(definition.minItems, remaining)
          : remaining;
      parameters[key] = takeNextImages(desiredCount);
      return;
    }

    if (definition.binding === "file") {
      const coverImageUrl =
        typeof project.coverImageUrl === "string" && project.coverImageUrl.length > 0
          ? project.coverImageUrl
          : undefined;
      const isCoverSlot =
        schema.templateKind === "cover" &&
        !mediaCursor.coverUsed &&
        typeof coverImageUrl === "string";

      if (isCoverSlot) {
        parameters[key] = coverImageUrl;
        mediaCursor.coverUsed = true;
        return;
      }

      parameters[key] = takeNextImages(1)[0] ?? "";
      return;
    }

    if (definition.type === "boolean") {
      parameters[key] = Boolean(definition.default ?? false);
      return;
    }

    parameters[key] = buildDefaultTextValue(key, project, now, mediaCursor.value);
  });

  return {
    parameters,
    assignedContentItemIds,
  };
};

const buildGeneratedSections = (
  project: Project,
  schemas: TemplateSchema[],
): GeneratedSection[] => {
  const kindOrder = getTemplateKindOrder();
  const mediaCursor = { value: 0, coverUsed: false };
  let pageNumber = 1;

  return [...schemas]
    .sort((left, right) => {
      if (left.templateKind !== right.templateKind) {
        return kindOrder.indexOf(left.templateKind) - kindOrder.indexOf(right.templateKind);
      }
      return left.name.localeCompare(right.name, "ko");
    })
    .map((schema, index) => {
      const sectionId = `section_${index + 1}`;
      const { parameters, assignedContentItemIds } = buildPageParameters(
        project,
        schema,
        mediaCursor,
      );

      const page: GeneratedPage = {
        id: `${sectionId}_page`,
        sectionId,
        pageNumber,
        kind: schema.templateKind,
        templateUid: schema.id,
        templateName: schema.name,
        schema,
        parameters,
        assignedContentItemIds,
      };

      pageNumber += 1;

      return {
        id: sectionId,
        title: schema.name,
        intro: `${schema.templateKind.toUpperCase()} · ${schema.theme}`,
        coverText: schema.description,
        pages: [page],
      };
    });
};

const generateCopyWithOpenAI = async (project: Project) => {
  if (!hasOpenAIConfig()) {
    return undefined;
  }

  try {
    const client = createOpenAIClient();
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Write one concise photobook headline in Korean. Return plain text only.",
        },
        {
          role: "user",
          content: `Title: ${project.title}\nImages: ${project.contentItems.length}`,
        },
      ],
    });

    return response.output_text.trim() || undefined;
  } catch {
    return undefined;
  }
};

export const createProjectDraft = async (input: {
  title: string;
  templateId: string;
  bookSpecId: string;
  coverImageUrl?: string;
  contentItems?: ContentItem[];
}) => {
  const now = new Date().toISOString();
  let sweetbookBookUid: string | undefined;

  if (hasSweetBookConfig()) {
    const createResponse = await sweetBookRequest<{ data: { bookUid: string } }>(
      "/books",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          bookSpecUid: input.bookSpecId,
        }),
      },
      `book-${Date.now()}-${crypto.randomUUID()}`,
    );

    sweetbookBookUid = createResponse.data.bookUid;
  }

  const project: Project = {
    id: crypto.randomUUID(),
    title: input.title,
    templateId: input.templateId,
    bookSpecId: input.bookSpecId,
    sweetbookBookUid,
    coverImageUrl: input.coverImageUrl,
    contentItems:
      input.contentItems && input.contentItems.length > 0
        ? input.contentItems
        : [],
    generatedSections: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  await saveProject(project);
  return project;
};

export const generateProjectSections = async (project: Project) => {
  const catalog = await getTemplateCatalogData();
  const selectedVariants = catalog.variants.filter(
    (variant) =>
      variant.theme === project.templateId && variant.bookSpecId === project.bookSpecId,
  );

  const detailRecords = await runWithConcurrency(selectedVariants, 2, async (variant) =>
    fetchTemplateDetailRecord(variant.id),
  );
  const selectedSchemas = detailRecords
    .filter((record): record is Record<string, unknown> => Boolean(record))
    .map(normalizeTemplateSchema);

  if (selectedSchemas.length === 0) {
    throw new Error(
      "No template schemas matched the selected theme family and book spec.",
    );
  }

  const generatedSections = buildGeneratedSections(project, selectedSchemas);
  const generatedHeadline = await generateCopyWithOpenAI(project);

  if (generatedHeadline && generatedSections[0]?.pages[0]) {
    const firstPage = generatedSections[0].pages[0];
    if ("title" in firstPage.parameters) {
      firstPage.parameters.title = generatedHeadline;
    }
  }

  return {
    ...project,
    generatedSections,
    status: "generated" as const,
    updatedAt: new Date().toISOString(),
  };
};

export const reorderProjectSections = (
  project: Project,
  sectionOrder: string[],
) => {
  const mapped = new Map(
    project.generatedSections.map((section) => [section.id, section]),
  );
  const reordered = sectionOrder
    .map((sectionId) => mapped.get(sectionId))
    .filter((section): section is GeneratedSection => Boolean(section))
    .map((section, index) => ({
      ...section,
      pages: section.pages.map((page) => ({
        ...page,
        pageNumber: index + 1,
      })),
    }));

  return {
    ...project,
    generatedSections: reordered,
    updatedAt: new Date().toISOString(),
  };
};

export const updateProjectPageParameters = (
  project: Project,
  pageId: string,
  updater: (
    current: Record<string, TemplateParameterValue>,
  ) => Record<string, TemplateParameterValue>,
) => ({
  ...project,
  generatedSections: project.generatedSections.map((section) => ({
    ...section,
    pages: section.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            parameters: updater(page.parameters),
          }
        : page,
    ),
  })),
  updatedAt: new Date().toISOString(),
});

export const estimateProject = async (
  project: Project,
  quantity: number,
): Promise<Estimate> => {
  if (!hasSweetBookConfig()) {
    throw new Error("SWEETBOOK_API_KEY is required to calculate estimates.");
  }

  if (!project.sweetbookBookUid || project.status !== "published") {
    throw new Error("Estimate is unavailable until the project has been published.");
  }

  const response = await sweetBookRequest<{
    data?: {
      totalAmount?: number;
      totalProductAmount?: number;
      totalShippingFee?: number;
    };
  }>("/orders/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ bookUid: project.sweetbookBookUid, quantity }],
    }),
  });

  if (response.data?.totalAmount === undefined) {
    throw new Error("The SweetBook API did not return an estimate.");
  }

  const total = response.data.totalAmount;
  const shippingFee = response.data.totalShippingFee ?? 3000;
  const subtotal = response.data.totalProductAmount ?? total - shippingFee;

  return {
    currency: "KRW",
    quantity,
    unitPrice: Math.round(subtotal / quantity),
    shippingFee,
    subtotal,
    total,
    note: "SweetBook Sandbox estimate",
  };
};

const marshalTemplateParameters = async (
  definitions: Record<string, TemplateParameterDefinition>,
  parameters: Record<string, TemplateParameterValue>,
) => {
  const formData = new FormData();
  const payload: Record<string, unknown> = {};

  for (const [key, definition] of Object.entries(definitions)) {
    const value = normalizeParameterValue(definition, parameters[key]);

    if (
      definition.binding === "rowGallery" ||
      definition.binding === "columnGallery"
    ) {
      const items = Array.isArray(value) ? value : [];
      payload[key] = await Promise.all(
        items.map(async (item, index) => {
          if (typeof item !== "string") {
            return "";
          }
          if (item.startsWith("data:")) {
            const fieldName = `${key}_${index}`;
            formData.append(
              fieldName,
              await toFileFromDataUrl(item, `${fieldName}.jpg`),
            );
            return fieldName;
          }
          return ensureAbsoluteAssetUrl(item);
        }),
      );
      continue;
    }

    if (definition.binding === "file") {
      if (typeof value === "string" && value.startsWith("data:")) {
        formData.append(key, await toFileFromDataUrl(value, `${key}.jpg`));
        payload[key] = key;
      } else if (typeof value === "string") {
        payload[key] = ensureAbsoluteAssetUrl(value);
      } else if (typeof definition.default === "string") {
        payload[key] = ensureAbsoluteAssetUrl(definition.default);
      } else {
        payload[key] = "";
      }
      continue;
    }

    payload[key] = value;
  }

  formData.append("parameters", JSON.stringify(payload));
  return formData;
};

export const publishProject = async (
  project: Project,
) => {
  if (!hasSweetBookConfig()) {
    throw new Error("SWEETBOOK_API_KEY is required to publish the book.");
  }

  if (project.sweetbookBookUid && project.status === "published") {
    return {
      sweetbookBookUid: project.sweetbookBookUid,
      status: "published" as const,
      pageCount: derivePageCount(project),
      finalizedAt: new Date().toISOString(),
      isMock: false,
    };
  }

  let bookUid = project.sweetbookBookUid;

  if (!bookUid) {
    const createResponse = await sweetBookRequest<{ data: { bookUid: string } }>(
      "/books",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          bookSpecUid: project.bookSpecId,
          externalRef: project.id,
        }),
      },
      `book-${project.id}-${Date.now()}`,
    );
    bookUid = createResponse.data.bookUid;
  }

  const pages = project.generatedSections.flatMap((section) => section.pages);
  const coverPage = pages.find((page) => page.kind === "cover");

  if (!coverPage) {
    throw new Error("The selected family does not provide a cover template.");
  }

  await sweetBookRequest(`/books/${bookUid}/contents`, {
    method: "DELETE",
  }).catch(() => undefined);

  const coverForm = await marshalTemplateParameters(
    coverPage.schema.parameterDefinitions,
    coverPage.parameters,
  );
  coverForm.append("templateUid", coverPage.templateUid);
  await sweetBookRequest(`/books/${bookUid}/cover`, {
    method: "POST",
    body: coverForm,
  });

  const contentPages = pages.filter(
    (page) => page.kind === "content" || page.kind === "divider",
  );

  for (const page of contentPages) {
    const formData = await marshalTemplateParameters(
      page.schema.parameterDefinitions,
      page.parameters,
    );
    formData.append("templateUid", page.templateUid);
    await sweetBookRequest(`/books/${bookUid}/contents?breakBefore=page`, {
      method: "POST",
      body: formData,
    });
  }

  const finalizationResponse = await sweetBookRequest<{
    data: { pageCount: number; finalizedAt: string };
  }>(`/books/${bookUid}/finalization`, {
    method: "POST",
    headers: { "Content-Length": "0" },
  });

  return {
    sweetbookBookUid: bookUid,
    status: "published" as const,
    pageCount: finalizationResponse.data.pageCount,
    finalizedAt: finalizationResponse.data.finalizedAt,
    isMock: false,
  };
};

export const createProjectOrder = async (
  project: Project,
  quantity: number,
  shipping: ShippingInfo,
): Promise<Order> => {
  if (!hasSweetBookConfig()) {
    throw new Error("SWEETBOOK_API_KEY is required to create an order.");
  }

  if (!project.sweetbookBookUid) {
    throw new Error("The project must be published before creating an order.");
  }

  const cleanShipping = {
    recipientName: shipping.recipientName,
    recipientPhone: shipping.recipientPhone,
    postalCode: shipping.postalCode,
    address1: shipping.address1,
    ...(shipping.address2 ? { address2: shipping.address2 } : {}),
    ...(shipping.memo ? { memo: shipping.memo } : {}),
  };

  const response = await sweetBookRequest<{ data: Order }>(
    "/orders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ bookUid: project.sweetbookBookUid, quantity }],
        shipping: cleanShipping,
        externalRef: project.id,
      }),
    },
    `order-${project.id}-${Date.now()}`,
  );

  return response.data;
};

export const derivePageCount = (project: Project) =>
  project.generatedSections.reduce(
    (count, section) => count + section.pages.length,
    0,
  );

export const deriveProjectHeadline = (project: Project) =>
  project.generatedSections[0]?.title ?? project.title;

