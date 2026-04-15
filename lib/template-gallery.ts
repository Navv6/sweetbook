import type {
  GeneratedPage,
  TemplateBinding,
  TemplateParameterDefinition,
  TemplateSchema,
} from "@/types/project";

export type GalleryBinding = Extract<
  TemplateBinding,
  "rowGallery" | "columnGallery" | "collageGallery"
>;

export type GalleryFieldDescriptor = {
  key: string;
  binding: GalleryBinding;
  required: boolean;
  minItems: number;
  label: string;
};

export const RECOMMENDED_ROW_GALLERY_ITEMS = 4;
export const MAX_ROW_GALLERY_ITEMS = 4;
export const RECOMMENDED_COLLAGE_GALLERY_ITEMS = 4;
export const MAX_COLLAGE_GALLERY_ITEMS = 4;

const isGalleryBinding = (
  binding: TemplateBinding,
): binding is GalleryBinding =>
  binding === "rowGallery" ||
  binding === "columnGallery" ||
  binding === "collageGallery";

const toGalleryFieldDescriptor = (
  key: string,
  definition: TemplateParameterDefinition,
): GalleryFieldDescriptor | null => {
  if (!isGalleryBinding(definition.binding)) {
    return null;
  }

  return {
    key,
    binding: definition.binding,
    required: definition.required,
    minItems: definition.minItems ?? 0,
    label: definition.description?.trim() || key,
  };
};

export const getGalleryFieldsFromSchema = (
  schema: TemplateSchema,
): GalleryFieldDescriptor[] =>
  Object.entries(schema.parameterDefinitions)
    .map(([key, definition]) => toGalleryFieldDescriptor(key, definition))
    .filter((field): field is GalleryFieldDescriptor => Boolean(field));

export const getGalleryFieldsFromPage = (
  page: Pick<GeneratedPage, "schema">,
): GalleryFieldDescriptor[] => getGalleryFieldsFromSchema(page.schema);

export const getRowGalleryFields = (
  page: Pick<GeneratedPage, "schema">,
): GalleryFieldDescriptor[] =>
  getGalleryFieldsFromPage(page).filter(
    (field) => field.binding === "rowGallery",
  );

export const getCollageGalleryFields = (
  page: Pick<GeneratedPage, "schema">,
): GalleryFieldDescriptor[] =>
  getGalleryFieldsFromPage(page).filter(
    (field) => field.binding === "collageGallery",
  );

export const getGalleryBindingKeyFromElement = (
  element: Pick<GeneratedPage["schema"]["layout"]["elements"][number], "photos" | "tag">,
): string | null => {
  if (typeof element.photos === "string") {
    const match = element.photos.match(/\$\$([A-Za-z0-9_]+)\$\$/);
    if (match) {
      return match[1];
    }
  }

  return typeof element.tag === "string" ? element.tag : null;
};

export const getAvailableRowGalleryField = (
  page: Pick<GeneratedPage, "schema">,
  elements: Pick<GeneratedPage["schema"]["layout"]["elements"][number], "photos" | "tag">[],
): GalleryFieldDescriptor | null => {
  const usedKeys = new Set(
    elements
      .map((element) => getGalleryBindingKeyFromElement(element))
      .filter((key): key is string => Boolean(key)),
  );

  return (
    getRowGalleryFields(page).find((field) => !usedKeys.has(field.key)) ?? null
  );
};

export const getAvailableCollageGalleryField = (
  page: Pick<GeneratedPage, "schema">,
  elements: Pick<GeneratedPage["schema"]["layout"]["elements"][number], "photos" | "tag">[],
): GalleryFieldDescriptor | null => {
  const usedKeys = new Set(
    elements
      .map((element) => getGalleryBindingKeyFromElement(element))
      .filter((key): key is string => Boolean(key)),
  );

  return (
    getCollageGalleryFields(page).find((field) => !usedKeys.has(field.key)) ??
    null
  );
};

export const isGalleryTemplatePage = (
  page: Pick<GeneratedPage, "schema">,
): boolean => getGalleryFieldsFromPage(page).length > 0;
