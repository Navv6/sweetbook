import OpenAI from "openai";

import { generateLayout, reorderGeneratedSections } from "@/lib/layout";
import {
  buildMockEstimate,
  createDemoContentItems,
  mockBookSpecs,
  mockOrderResponse,
  mockTemplates,
} from "@/lib/mock";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type {
  BookSpecOption,
  ContentItem,
  Estimate,
  Order,
  Project,
  ShippingInfo,
  TemplateOption,
} from "@/types/project";

const SWEETBOOK_BASE_URL =
  process.env.SWEETBOOK_API_BASE_URL ?? "https://api-sandbox.sweetbook.com/v1";

const hasSweetBookConfig = () => Boolean(process.env.SWEETBOOK_API_KEY);
const hasOpenAIConfig = () => Boolean(process.env.OPENAI_API_KEY);

const sweetBookRequest = async <T>(
  path: string,
  init?: RequestInit,
  idempotencyKey?: string,
) => {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${process.env.SWEETBOOK_API_KEY}`);

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
    throw new Error(
      payload?.message ?? `${path} \uC694\uCCAD \uC2E4\uD328 (${response.status})`,
    );
  }

  return payload as T;
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

export const getTemplateOptions = async (): Promise<TemplateOption[]> => {
  if (!hasSweetBookConfig()) {
    return mockTemplates;
  }

  try {
    const response = await sweetBookRequest<{
      data?: {
        items?: Array<Record<string, unknown>>;
        templates?: Array<Record<string, unknown>>;
      };
    }>("/templates");

    const items = response.data?.items ?? response.data?.templates ?? [];
    const normalized = items.slice(0, 6).map((item, index) => ({
      id: String(
        item.templateUid ?? item.uid ?? mockTemplates[index % mockTemplates.length].id,
      ),
      name: String(item.name ?? item.title ?? `Template ${index + 1}`),
      description: String(
        item.description ??
          item.summary ??
          "SweetBook \uD15C\uD50C\uB9BF \uC635\uC158",
      ),
      accentColor: mockTemplates[index % mockTemplates.length].accentColor,
      coverLabel: String(item.category ?? "SweetBook Template"),
    }));

    return normalized.length > 0 ? normalized : mockTemplates;
  } catch {
    return mockTemplates;
  }
};

export const getBookSpecOptions = async (): Promise<BookSpecOption[]> => {
  if (!hasSweetBookConfig()) {
    return mockBookSpecs;
  }

  try {
    const response = await sweetBookRequest<{
      data?: {
        items?: Array<Record<string, unknown>>;
        bookSpecs?: Array<Record<string, unknown>>;
      };
    }>("/book-specs");

    const items = response.data?.items ?? response.data?.bookSpecs ?? [];
    const normalized = items.slice(0, 6).map((item, index) => ({
      id: String(
        item.bookSpecUid ?? item.uid ?? mockBookSpecs[index % mockBookSpecs.length].id,
      ),
      name: String(item.name ?? `Book Spec ${index + 1}`),
      description: String(
        item.description ?? "SweetBook \uD310\uD615 \uC635\uC158",
      ),
      width: Number(item.width ?? mockBookSpecs[index % mockBookSpecs.length].width),
      height: Number(item.height ?? mockBookSpecs[index % mockBookSpecs.length].height),
      minPages: Number(item.minPages ?? item.minPageCount ?? 20),
      maxPages: Number(item.maxPages ?? item.maxPageCount ?? 120),
      pageStep: Number(item.pageStep ?? item.pageIncrement ?? 2),
    }));

    return normalized.length > 0 ? normalized : mockBookSpecs;
  } catch {
    return mockBookSpecs;
  }
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
            "You write concise Korean photobook copy. Return strict JSON array with 4 objects. Each object must have title, intro, cover.",
        },
        {
          role: "user",
          content: `\uD504\uB85C\uC81D\uD2B8 \uC81C\uBAA9: ${project.title}\n\uC774\uBBF8\uC9C0 \uC218: ${project.contentItems.length}\n\uCC28\uBD84\uD558\uACE0 \uAC04\uACB0\uD55C \uD3EC\uD1A0\uBD81 \uC12C\uB124\uC77C \uCE74\uD53C\uB97C \uB124 \uC139\uC158 \uBD84\uB7C9\uC73C\uB85C \uC791\uC131\uD574 \uC8FC\uC138\uC694.`,
        },
      ],
    });

    const parsed = JSON.parse(response.output_text) as Array<{
      title: string;
      intro: string;
      cover: string;
    }>;

    return Array.isArray(parsed) ? parsed : undefined;
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
  const project: Project = {
    id: crypto.randomUUID(),
    title: input.title,
    templateId: input.templateId,
    bookSpecId: input.bookSpecId,
    coverImageUrl: input.coverImageUrl,
    contentItems:
      input.contentItems && input.contentItems.length > 0
        ? input.contentItems
        : createDemoContentItems(),
    generatedSections: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient();

    if (supabase) {
      await supabase.from("projects").upsert({
        id: project.id,
        payload: project,
        updated_at: now,
      });
    }
  }

  return project;
};

export const generateProjectSections = async (project: Project) => {
  const copyOverrides = await generateCopyWithOpenAI(project);
  const generatedSections = await generateLayout(
    project,
    project.contentItems,
    copyOverrides,
  );

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
) => ({
  ...project,
  generatedSections: reorderGeneratedSections(
    project.generatedSections,
    sectionOrder,
  ),
  updatedAt: new Date().toISOString(),
});

export const estimateProject = async (
  project: Project,
  quantity: number,
): Promise<Estimate> => {
  if (hasSweetBookConfig() && project.sweetbookBookUid) {
    try {
      const response = await sweetBookRequest<{
        data?: {
          totalAmount?: number;
          totalProductAmount?: number;
          totalShippingFee?: number;
          currency?: string;
        };
      }>("/orders/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ bookUid: project.sweetbookBookUid, quantity }],
        }),
      });

      if (response.data?.totalAmount !== undefined) {
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
          note: "SweetBook Sandbox 견적",
        };
      }
    } catch {
      // fallback to mock below
    }
  }

  return buildMockEstimate(project, quantity);
};

const resolveImageFile = async (
  imageUrl: string,
  fileName: string,
): Promise<File | null> => {
  if (!imageUrl.startsWith("data:")) return null;
  return toFileFromDataUrl(imageUrl, fileName);
};

// 실제 SweetBook API에 존재하는 templateUid 매핑 (bookSpecUid 기준)
const COVER_TEMPLATE: Record<string, string> = {
  PHOTOBOOK_A4_SC: "31LOxBQzsVwo", // 일기장A 표지 A4
  PHOTOBOOK_A5_SC: "3sVKHg6kk7w0", // 일기장A 표지 A5
  SQUAREBOOK_HC:   "31LOxBQzsVwo", // fallback: A4 커버 사용
};
const CONTENT_STORY_TEMPLATE: Record<string, string> = {
  PHOTOBOOK_A4_SC: "3nWJ4wtPSQOb", // 일기장A 내지a A4
  PHOTOBOOK_A5_SC: "3EM5xgRpQhK1", // 일기장A 내지a A5
  SQUAREBOOK_HC:   "3FhSEhJ94c0T", // 일기장B 내지 SQUAREBOOK
};
const CONTENT_GALLERY_TEMPLATE: Record<string, string> = {
  PHOTOBOOK_A4_SC: "msFsr6Ult7qw", // 일기장A gallery A4
  PHOTOBOOK_A5_SC: "ebGpPDmn6EJ5", // 일기장A gallery A5
  SQUAREBOOK_HC:   "3FhSEhJ94c0T", // fallback
};

export const publishProject = async (project: Project) => {
  if (!hasSweetBookConfig()) {
    return {
      sweetbookBookUid: `bk_mock_${project.id}`,
      status: "published" as const,
      finalizedAt: new Date().toISOString(),
      isMock: true,
    };
  }

  const specUid = project.bookSpecId;

  const createResponse = await sweetBookRequest<{ data: { bookUid: string } }>(
    "/books",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: project.title,
        bookSpecUid: specUid,
        externalRef: project.id,
      }),
    },
    `book-${project.id}`,
  );

  const bookUid = createResponse.data.bookUid;
  const coverImage =
    project.coverImageUrl ??
    project.contentItems.find((item) => item.imageUrl)?.imageUrl ??
    "https://api-sandbox.sweetbook.com/templates_thumb/31LOxBQzsVwo/layout.jpg";

  const coverTemplateUid = COVER_TEMPLATE[specUid] ?? COVER_TEMPLATE.PHOTOBOOK_A4_SC;
  const coverForm = new FormData();
  coverForm.append("templateUid", coverTemplateUid);
  coverForm.append(
    "parameters",
    JSON.stringify({
      title: project.title,
      author: "SweetBook Studio",
      frontPhoto: coverImage.startsWith("data:") ? "$upload" : coverImage,
      backPhoto: coverImage.startsWith("data:") ? "$upload" : coverImage,
    }),
  );

  if (coverImage.startsWith("data:")) {
    coverForm.append(
      "frontPhoto",
      await toFileFromDataUrl(coverImage, "cover.jpg"),
    );
  }

  await sweetBookRequest(`/books/${bookUid}/cover`, {
    method: "POST",
    body: coverForm,
  });

  for (const section of project.generatedSections) {
    for (const page of section.pages.filter((item) => item.kind === "content")) {
      const imageElements = page.elements.filter((element) => element.type === "image");
      const textElement = page.elements.find(
        (element): element is Extract<typeof element, { type: "text" }> =>
          element.type === "text" && element.role !== "caption",
      );
      const bodyText = textElement?.value ?? section.intro;
      const formData = new FormData();

      const galleryTplUid = CONTENT_GALLERY_TEMPLATE[specUid] ?? CONTENT_GALLERY_TEMPLATE.PHOTOBOOK_A4_SC;
      const storyTplUid = CONTENT_STORY_TEMPLATE[specUid] ?? CONTENT_STORY_TEMPLATE.PHOTOBOOK_A4_SC;

      if (page.templateKey === "gallery") {
        const galleryPhotoNames: string[] = [];

        for (const [index, image] of imageElements.entries()) {
          const file = await resolveImageFile(
            image.imageUrl,
            `gallery-${section.id}-${index}.jpg`,
          );
          const name = `galleryPhoto_${index}`;
          if (file) {
            formData.append(name, file);
          }
          galleryPhotoNames.push(image.imageUrl.startsWith("data:") ? name : image.imageUrl);
        }

        formData.append("templateUid", galleryTplUid);
        formData.append(
          "parameters",
          JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            galleryPhotos: galleryPhotoNames,
            contents: bodyText,
          }),
        );
      } else {
        const primaryImage = imageElements[0];
        const primaryFile = primaryImage
          ? await resolveImageFile(primaryImage.imageUrl, `${page.id}.jpg`)
          : null;

        if (primaryFile) {
          formData.append("imageMain", primaryFile);
        }

        formData.append("templateUid", storyTplUid);
        formData.append(
          "parameters",
          JSON.stringify({
            imageMain: primaryFile ? "imageMain" : (primaryImage?.imageUrl ?? "/demo/editorial-desk.svg"),
            dateStr: new Date().toISOString().slice(0, 10),
            contents: bodyText,
          }),
        );
      }

      await sweetBookRequest(`/books/${bookUid}/contents?breakBefore=page`, {
        method: "POST",
        body: formData,
      });
    }
  }

  const finalizationResponse = await sweetBookRequest<{
    data: { pageCount: number; finalizedAt: string };
  }>(`/books/${bookUid}/finalization`, {
    method: "POST",
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
  if (!hasSweetBookConfig() || !project.sweetbookBookUid) {
    return mockOrderResponse(project, quantity, shipping);
  }

  const response = await sweetBookRequest<{ data: Order }>(
    "/orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            bookUid: project.sweetbookBookUid,
            quantity,
          },
        ],
        shipping,
        externalRef: project.id,
      }),
    },
    `order-${project.id}`,
  );

  return response.data;
};
