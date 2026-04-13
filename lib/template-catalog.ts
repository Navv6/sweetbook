import { mockTemplates } from "@/lib/mock";
import type {
  CatalogSummary,
  TemplateBaseLayer,
  TemplateBinding,
  TemplateKind,
  TemplateLayout,
  TemplateLayoutElement,
  TemplateLayoutRules,
  TemplateOption,
  TemplateParameterDefinition,
  TemplateParameterValue,
  TemplateSchema,
  TemplateVariant,
} from "@/types/project";

type RawTemplateRecord = Record<string, unknown>;

const TEMPLATE_KIND_ORDER: TemplateKind[] = [
  "cover",
  "content",
  "divider",
  "publish",
];

const THEME_COLORS: Record<string, string> = {
  공용: "#6B7280",
  구글포토북A: "#4A6FA5",
  구글포토북B: "#305C8C",
  구글포토북C: "#274C77",
  알림장A: "#4C8B74",
  알림장B: "#7A8F41",
  알림장C: "#A66B4C",
  일기장A: "#9A9088",
  일기장B: "#71667C",
};

const SPEC_LABELS: Record<string, string> = {
  PHOTOBOOK_A4_SC: "A4",
  PHOTOBOOK_A5_SC: "A5",
  SQUAREBOOK_HC: "Square",
};

const asObjectRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asArrayRecord = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : fallback;

const toAbsoluteThumbnailUrl = (value?: string) => {
  if (value?.startsWith("http://") || value?.startsWith("https://")) {
    return value;
  }

  if (value?.startsWith("/")) {
    return `https://api-sandbox.sweetbook.com${value}`;
  }

  return undefined;
};

const inferThemeFromName = (name: string) => {
  const prefix = name.split("_")[0]?.trim();
  return prefix || "공용";
};

const normalizeTheme = (theme: unknown, name: string) => {
  if (typeof theme === "string" && theme.trim().length > 0) {
    return theme.trim();
  }
  return inferThemeFromName(name);
};

const normalizeTemplateKind = (value: unknown): TemplateKind => {
  switch (value) {
    case "cover":
    case "content":
    case "divider":
    case "publish":
      return value;
    default:
      return "content";
  }
};

const normalizeBinding = (value: unknown): TemplateBinding => {
  switch (value) {
    case "text":
    case "file":
    case "rowGallery":
    case "columnGallery":
      return value;
    default:
      return "unknown";
  }
};

const buildFamilyDescription = (theme: string, variants: TemplateVariant[]) => {
  if (theme.startsWith("일기장")) {
    return "Diary-oriented family with title, date, and gallery-driven body pages.";
  }

  if (theme.startsWith("알림장")) {
    return "Notice-book family with structured text blocks and classroom-style metadata.";
  }

  if (theme.startsWith("구글포토북")) {
    return "Photo-forward family with larger image areas and lighter copy density.";
  }

  return `${variants.length} public template variants grouped under a shared family.`;
};

const buildCoverLabel = (bookSpecIds: string[]) =>
  bookSpecIds.map((bookSpecId) => SPEC_LABELS[bookSpecId] ?? bookSpecId).join(" / ");

const pickAccentColor = (theme: string) => THEME_COLORS[theme] ?? "#6B7280";

const normalizeDefinition = (value: unknown): TemplateParameterDefinition => {
  const record = asObjectRecord(value);
  const defaultValue = record.default;

  return {
    binding: normalizeBinding(record.binding),
    type: asString(record.type, "string"),
    required: Boolean(record.required),
    description: asString(record.description),
    default:
      typeof defaultValue === "string" ||
      typeof defaultValue === "boolean" ||
      typeof defaultValue === "number"
        ? defaultValue
        : null,
    itemType: typeof record.itemType === "string" ? record.itemType : undefined,
    minItems: typeof record.minItems === "number" ? record.minItems : undefined,
  };
};

const normalizeLayoutElement = (value: unknown): TemplateLayoutElement => {
  const record = asObjectRecord(value);
  const position = asObjectRecord(record.position);
  const container = asObjectRecord(record.container);
  const row = asObjectRecord(container.row);
  const frame = asObjectRecord(record.frame);

  return {
    element_id: asString(record.element_id),
    groupName: typeof record.groupName === "string" ? record.groupName : undefined,
    type: asString(record.type, "text"),
    text: typeof record.text === "string" ? record.text : undefined,
    imageSource:
      typeof record.imageSource === "string" ? record.imageSource : undefined,
    fileName: typeof record.fileName === "string" ? record.fileName : undefined,
    photos: typeof record.photos === "string" ? record.photos : undefined,
    tag: typeof record.tag === "string" ? record.tag : undefined,
    fit: typeof record.fit === "string" ? record.fit : undefined,
    graphicType:
      typeof record.graphicType === "string" ? record.graphicType : undefined,
    position: {
      x: asNumber(position.x),
      y: asNumber(position.y),
    },
    width: typeof record.width === "number" ? record.width : undefined,
    height: typeof record.height === "number" ? record.height : undefined,
    backgroundColor:
      typeof record.backgroundColor === "string"
        ? record.backgroundColor
        : undefined,
    color: typeof record.color === "string" ? record.color : undefined,
    cornerRadius:
      typeof record.cornerRadius === "number" ? record.cornerRadius : undefined,
    fontFamily:
      typeof record.fontFamily === "string" ? record.fontFamily : undefined,
    fontSize: typeof record.fontSize === "number" ? record.fontSize : undefined,
    textAlignment:
      typeof record.textAlignment === "string" ? record.textAlignment : undefined,
    verticalAlignment:
      typeof record.verticalAlignment === "string"
        ? record.verticalAlignment
        : undefined,
    textBrush: typeof record.textBrush === "string" ? record.textBrush : undefined,
    textBold: typeof record.textBold === "boolean" ? record.textBold : undefined,
    textLineHeight:
      typeof record.textLineHeight === "number" ? record.textLineHeight : undefined,
    textOffset:
      typeof record.textOffset === "number" ? record.textOffset : undefined,
    visible:
      typeof record.visible === "string" || typeof record.visible === "boolean"
        ? (record.visible as string | boolean)
        : undefined,
    isDynamic:
      typeof record.isDynamic === "boolean" ? record.isDynamic : undefined,
    splittable:
      typeof record.splittable === "boolean" ? record.splittable : undefined,
    container:
      Object.keys(container).length > 0
        ? {
            maxWidth:
              typeof container.maxWidth === "number" ? container.maxWidth : undefined,
            maxHeight:
              typeof container.maxHeight === "number" ? container.maxHeight : undefined,
            itemGap:
              typeof container.itemGap === "number" ? container.itemGap : undefined,
            padding:
              typeof container.padding === "number" ? container.padding : undefined,
            row:
              Object.keys(row).length > 0
                ? {
                    maxHeight:
                      typeof row.maxHeight === "number" ? row.maxHeight : undefined,
                    fillMiddle:
                      typeof row.fillMiddle === "boolean" ? row.fillMiddle : undefined,
                  }
                : undefined,
          }
        : undefined,
    frame:
      Object.keys(frame).length > 0
        ? {
            cornerRadius:
              typeof frame.cornerRadius === "number"
                ? frame.cornerRadius
                : undefined,
          }
        : undefined,
  };
};

const normalizeLayout = (value: unknown): TemplateLayout => {
  const record = asObjectRecord(value);
  const elements = asArrayRecord(record.elements).map(normalizeLayoutElement);
  const inferredWidth = elements.reduce((max, element) => {
    const width = typeof element.width === "number" ? element.width : 0;
    return Math.max(max, element.position.x + width);
  }, 0);
  const inferredHeight = elements.reduce((max, element) => {
    const height = typeof element.height === "number" ? element.height : 0;
    return Math.max(max, element.position.y + height);
  }, 0);

  return {
    width: asNumber(record.width, inferredWidth || 1000),
    height: asNumber(record.height, inferredHeight || 1000),
    backgroundColor:
      typeof record.backgroundColor === "string"
        ? record.backgroundColor
        : undefined,
    elements,
  };
};

const normalizeLayoutRules = (value: unknown): TemplateLayoutRules | undefined => {
  const record = asObjectRecord(value);
  if (Object.keys(record).length === 0) {
    return undefined;
  }

  const flow = asObjectRecord(record.flow);
  const itemSpacing = asObjectRecord(flow.itemSpacing);
  const margin = asObjectRecord(record.margin);
  const pageMargin = asObjectRecord(margin.pageMargin);

  return {
    flow: {
      columns: typeof flow.columns === "number" ? flow.columns : undefined,
      columnGap: typeof flow.columnGap === "number" ? flow.columnGap : undefined,
      itemSpacing: {
        size: typeof itemSpacing.size === "number" ? itemSpacing.size : undefined,
      },
    },
    margin: {
      pageMargin: {
        spine:
          typeof pageMargin.spine === "number" ? pageMargin.spine : undefined,
        fore: typeof pageMargin.fore === "number" ? pageMargin.fore : undefined,
        head: typeof pageMargin.head === "number" ? pageMargin.head : undefined,
        tail: typeof pageMargin.tail === "number" ? pageMargin.tail : undefined,
      },
    },
    shiftUpOnHide:
      typeof record.shiftUpOnHide === "boolean"
        ? record.shiftUpOnHide
        : undefined,
  };
};

const normalizeBaseLayer = (value: unknown): TemplateBaseLayer | undefined => {
  const record = asObjectRecord(value);
  if (Object.keys(record).length === 0) {
    return undefined;
  }

  const odd = asObjectRecord(record.odd);
  const even = asObjectRecord(record.even);

  return {
    odd:
      Object.keys(odd).length > 0
        ? { elements: asArrayRecord(odd.elements).map(normalizeLayoutElement) }
        : undefined,
    even:
      Object.keys(even).length > 0
        ? { elements: asArrayRecord(even.elements).map(normalizeLayoutElement) }
        : undefined,
  };
};

export const normalizeTemplateVariants = (
  items: RawTemplateRecord[],
): TemplateVariant[] =>
  items.map((item, index) => {
    const name = asString(
      item.templateName ?? item.name ?? item.title,
      `Template ${index + 1}`,
    );
    const theme = normalizeTheme(item.theme, name);
    const templateKind = normalizeTemplateKind(item.templateKind);
    const templateUid = asString(item.templateUid ?? item.uid, `${theme}-${index}`);

    return {
      id: templateUid,
      name,
      description: asString(item.description ?? item.summary, `${theme} ${templateKind}`),
      templateKind,
      theme,
      bookSpecId: asString(item.bookSpecUid ?? item.bookSpecId, "unknown"),
      category:
        typeof item.category === "string" && item.category.trim().length > 0
          ? item.category
          : null,
      thumbnailUrl: toAbsoluteThumbnailUrl(
        asString(item.thumbnailUrl ?? item.thumbnail ?? item.thumbnailPath),
      ),
    };
  });

export const normalizeTemplateSchema = (value: RawTemplateRecord): TemplateSchema => {
  const variant = normalizeTemplateVariants([value])[0];
  const parameterDefinitionsRecord = asObjectRecord(
    asObjectRecord(value.parameters).definitions,
  );
  const parameterDefinitions = Object.fromEntries(
    Object.entries(parameterDefinitionsRecord).map(([key, definition]) => [
      key,
      normalizeDefinition(definition),
    ]),
  ) as Record<string, TemplateParameterDefinition>;

  return {
    ...variant,
    parameterDefinitions,
    layout: normalizeLayout(value.layout),
    layoutRules: normalizeLayoutRules(value.layoutRules),
    baseLayer: normalizeBaseLayer(value.baseLayer),
  };
};

export const buildTemplateFamilies = (
  variants: TemplateVariant[],
): TemplateOption[] => {
  const grouped = new Map<string, TemplateVariant[]>();

  variants.forEach((variant) => {
    const current = grouped.get(variant.theme) ?? [];
    current.push(variant);
    grouped.set(variant.theme, current);
  });

  return Array.from(grouped.entries())
    .map(([theme, familyVariants]) => {
      const bookSpecIds = Array.from(
        new Set(familyVariants.map((variant) => variant.bookSpecId)),
      ).sort((left, right) => {
        const leftIndex = Object.keys(SPEC_LABELS).indexOf(left);
        const rightIndex = Object.keys(SPEC_LABELS).indexOf(right);
        return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
      });
      const templateKinds = TEMPLATE_KIND_ORDER.filter((kind) =>
        familyVariants.some((variant) => variant.templateKind === kind),
      );
      const coverVariant =
        familyVariants.find((variant) => variant.templateKind === "cover") ??
        familyVariants[0];

      return {
        id: theme,
        name: theme,
        description: buildFamilyDescription(theme, familyVariants),
        accentColor: pickAccentColor(theme),
        coverLabel: buildCoverLabel(bookSpecIds),
        theme,
        bookSpecIds,
        templateKinds,
        templateCount: familyVariants.length,
        variants: [...familyVariants].sort((left, right) => {
          if (left.bookSpecId !== right.bookSpecId) {
            return left.bookSpecId.localeCompare(right.bookSpecId, "ko");
          }
          return (
            TEMPLATE_KIND_ORDER.indexOf(left.templateKind) -
            TEMPLATE_KIND_ORDER.indexOf(right.templateKind)
          );
        }),
        thumbnailUrl: coverVariant?.thumbnailUrl,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "ko"));
};

export const buildCatalogSummary = (
  variants: TemplateVariant[],
  families: TemplateOption[],
): CatalogSummary => {
  const templateKinds = TEMPLATE_KIND_ORDER.filter((kind) =>
    variants.some((variant) => variant.templateKind === kind),
  );

  return {
    totalTemplates: variants.length,
    familyCount: families.length,
    templateKindCount: templateKinds.length,
    templateKinds,
  };
};

export const buildMockCatalog = () => ({
  templates: mockTemplates,
  summary: {
    totalTemplates: mockTemplates.reduce(
      (total, template) => total + template.templateCount,
      0,
    ),
    familyCount: mockTemplates.length,
    templateKindCount: 4,
    templateKinds: [...TEMPLATE_KIND_ORDER],
  } satisfies CatalogSummary,
  isFallback: true,
  message:
    "Showing the mock catalog so the API fallback behavior can be verified without credentials.",
});

export const getTemplateKindOrder = () => [...TEMPLATE_KIND_ORDER];

const scoreVariantName = (name: string) => {
  const normalized = name.toLowerCase();

  if (normalized.includes("gallery")) {
    return 100;
  }
  if (normalized.includes("contain")) {
    return 0;
  }
  if (normalized.includes("cover")) {
    return 1;
  }
  if (normalized.includes("fill")) {
    return 2;
  }
  if (normalized.includes("a")) {
    return 3;
  }
  if (normalized.includes("b")) {
    return 4;
  }
  return 10;
};

export const resolveTemplateFamilyForPublish = (
  families: TemplateOption[],
  theme: string,
  bookSpecId: string,
) => {
  const family = families.find((item) => item.theme === theme);
  if (!family) {
    return null;
  }

  const scopedVariants = family.variants.filter(
    (variant) => variant.bookSpecId === bookSpecId,
  );
  const cover = scopedVariants.find((variant) => variant.templateKind === "cover");
  const divider = scopedVariants.find((variant) => variant.templateKind === "divider");
  const publish = scopedVariants.find((variant) => variant.templateKind === "publish");
  const contentVariants = scopedVariants.filter(
    (variant) => variant.templateKind === "content",
  );
  const gallery =
    contentVariants.find((variant) =>
      variant.name.toLowerCase().includes("gallery"),
    ) ?? null;
  const story =
    contentVariants
      .filter((variant) => !variant.name.toLowerCase().includes("gallery"))
      .sort((left, right) => scoreVariantName(left.name) - scoreVariantName(right.name))[0] ??
    null;

  return {
    family,
    cover,
    divider,
    publish,
    gallery,
    story,
  };
};

export const resolveTemplateValue = (
  value: string | boolean | undefined,
  parameters: Record<string, TemplateParameterValue>,
  pageNumber: number,
) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\$\$([A-Za-z0-9_]+)\$\$/g, (_, key: string) => {
      const parameterValue = parameters[key];
      if (Array.isArray(parameterValue)) {
        return parameterValue.join(", ");
      }
      if (parameterValue === null || parameterValue === undefined) {
        return "";
      }
      return String(parameterValue);
    })
    .replace(/@@pageNum@@/g, String(pageNumber));
};

export const normalizeParameterValue = (
  definition: TemplateParameterDefinition,
  value: TemplateParameterValue | undefined,
): TemplateParameterValue => {
  if (value !== undefined) {
    return value;
  }

  if (definition.default !== undefined) {
    return definition.default as TemplateParameterValue;
  }

  if (
    definition.binding === "rowGallery" ||
    definition.binding === "columnGallery"
  ) {
    return [];
  }

  if (definition.type === "boolean") {
    return false;
  }

  return "";
};
