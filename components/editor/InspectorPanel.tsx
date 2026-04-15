import type { ReactNode } from "react";

import { Input } from "@/components/ui/Input";
import {
  MAX_COLLAGE_GALLERY_ITEMS,
  MAX_ROW_GALLERY_ITEMS,
  RECOMMENDED_COLLAGE_GALLERY_ITEMS,
  RECOMMENDED_ROW_GALLERY_ITEMS,
} from "@/lib/template-gallery";
import type {
  GeneratedPage,
  TemplateBinding,
  TemplateLayoutElement,
  TemplateParameterDefinition,
  TemplateParameterValue,
} from "@/types/project";

type ResolvedGalleryKind = "rowGallery" | "columnGallery" | "collageGallery";

const resolveGalleryKindFromElements = (
  page: GeneratedPage,
  key: string,
): ResolvedGalleryKind | null => {
  const elements: TemplateLayoutElement[] =
    page.layoutOverrides ?? page.schema.layout.elements;

  const match = elements.find((element) => {
    if (typeof element.photos === "string") {
      const token = element.photos.match(/\$\$([A-Za-z0-9_]+)\$\$/);
      if (token && token[1] === key) return true;
    }
    return element.tag === key;
  });

  if (match?.type === "rowGallery") return "rowGallery";
  if (match?.type === "columnGallery") return "columnGallery";
  if (match?.type === "collageGallery") return "collageGallery";
  return null;
};

const fieldLabel = (key: string, definition: TemplateParameterDefinition) =>
  definition.description?.trim() || key;

const bindingBadgeClass: Record<TemplateBinding | "default", string> = {
  text: "border-amber-200 bg-amber-50 text-amber-700",
  file: "border-blue-200 bg-blue-50 text-blue-700",
  rowGallery: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  columnGallery: "border-violet-200 bg-violet-50 text-violet-700",
  collageGallery: "border-purple-200 bg-purple-50 text-purple-700",
  unknown: "border-outline/20 bg-surface-container-low text-secondary",
  default: "border-outline/20 bg-surface-container-low text-secondary",
};

const bindingLabel = (binding: TemplateBinding) => binding;

const pillClass = (binding: TemplateBinding | "default") =>
  `rounded-md border px-2 py-0.5 text-[11px] font-medium ${bindingBadgeClass[binding]}`;

const requiredPillClass =
  "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700";

const cardClass = (isSelected: boolean) =>
  [
    "rounded-2xl border p-5 transition",
    isSelected
      ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]"
      : "border-outline/20 bg-surface-container-low hover:border-outline/40",
  ].join(" ");

function FieldHeader({
  fieldKey,
  definition,
  title,
  trailing,
}: {
  fieldKey: string;
  definition: TemplateParameterDefinition;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-secondary">{fieldKey}</p>
        </div>
        {trailing}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={pillClass(definition.binding)}>
          {bindingLabel(definition.binding)}
        </span>
        <span className={pillClass("default")}>{definition.type}</span>
        {definition.required && <span className={requiredPillClass}>required</span>}
      </div>
    </>
  );
}

export function InspectorPanel({
  page,
  selectedFieldKey,
  onSelectField,
  onParameterChange,
  onFileChange,
  className = "",
}: {
  page: GeneratedPage | null;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
  onParameterChange: (fieldKey: string, value: TemplateParameterValue) => void;
  onFileChange: (fieldKey: string, file: File, index?: number) => void;
  className?: string;
}) {
  if (!page) {
    return (
      <aside className={`glass-panel rounded-[1.75rem] p-6 ${className}`}>
        <p className="text-lg font-semibold text-foreground">Parameters</p>
      </aside>
    );
  }

  const entries = Object.entries(page.schema.parameterDefinitions);

  return (
    <aside className={`glass-panel rounded-[1.75rem] p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground">Parameters</p>
        <span className="text-xs uppercase tracking-[0.18em] text-secondary">
          {entries.length}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-surface-container-low p-5">
        <p className="display-copy text-2xl text-foreground">
          {page.templateName}
        </p>
        <p className="editorial-copy mt-2 text-sm">
          {`${page.schema.theme} · ${page.schema.bookSpecId}`}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map(([key, definition]) => {
          const value = page.parameters[key];
          const isSelected = selectedFieldKey === key;

          const resolvedGalleryKind: ResolvedGalleryKind | null =
            definition.binding === "rowGallery" ||
            definition.binding === "columnGallery" ||
            definition.binding === "collageGallery"
              ? definition.binding
              : definition.type === "array"
                ? resolveGalleryKindFromElements(page, key) ?? "rowGallery"
                : null;

          if (resolvedGalleryKind) {
            const gallery = Array.isArray(value) ? value : [];
            const isRowGallery = resolvedGalleryKind === "rowGallery";
            const isCollageGallery = resolvedGalleryKind === "collageGallery";
            const galleryMaxItems = isRowGallery
              ? MAX_ROW_GALLERY_ITEMS
              : isCollageGallery
                ? MAX_COLLAGE_GALLERY_ITEMS
                : null;
            const canAddImage =
              galleryMaxItems === null || gallery.length < galleryMaxItems;

            const galleryDefinition: TemplateParameterDefinition = {
              ...definition,
              binding: resolvedGalleryKind,
            };

            return (
              <div key={key} className={cardClass(isSelected)}>
                <button
                  type="button"
                  onClick={() => onSelectField(key)}
                  className="w-full text-left"
                >
                  <FieldHeader
                    fieldKey={key}
                    definition={galleryDefinition}
                    title={fieldLabel(key, definition)}
                    trailing={
                      <span className={pillClass(resolvedGalleryKind)}>
                        {gallery.length} items
                      </span>
                    }
                  />
                </button>

                {isSelected && (
                  <>
                    <div className="mt-4 grid gap-3">
                      {gallery.length > 0 ? (
                        gallery.map((item, index) => (
                          <div
                            key={`${key}-${index}`}
                            className="rounded-2xl border border-outline/20 bg-surface-container-lowest p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                                {`Image ${index + 1}`}
                              </p>
                              <button
                                type="button"
                                aria-label={`remove-${key}-${index}`}
                                onClick={() => {
                                  const next = gallery.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  );
                                  onParameterChange(key, next);
                                }}
                                className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary transition hover:text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={item}
                                onChange={(event) => {
                                  const next = [...gallery];
                                  next[index] = event.target.value;
                                  onParameterChange(key, next);
                                }}
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    onFileChange(key, file, index);
                                  }
                                }}
                                className="block w-full text-sm text-secondary"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-lowest px-4 py-3 text-xs text-secondary">
                          Add images to build this gallery layout.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label={`add-${key}-item`}
                      disabled={!canAddImage}
                      onClick={() => onParameterChange(key, [...gallery, ""])}
                      className="mt-4 rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary transition hover:bg-surface-container hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add image
                    </button>

                    <div className="mt-3 text-xs text-secondary">
                      {isRowGallery
                        ? `Recommended ${RECOMMENDED_ROW_GALLERY_ITEMS} images. You can add between 1 and ${MAX_ROW_GALLERY_ITEMS}.`
                        : isCollageGallery
                          ? `Recommended ${RECOMMENDED_COLLAGE_GALLERY_ITEMS} images. You can add between 1 and ${MAX_COLLAGE_GALLERY_ITEMS}.`
                          : "Gallery fields support one or more images."}
                    </div>
                  </>
                )}
              </div>
            );
          }

          if (definition.binding === "file") {
            return (
              <div key={key} className={cardClass(isSelected)}>
                <button
                  type="button"
                  onClick={() => onSelectField(key)}
                  className="w-full text-left"
                >
                  <FieldHeader
                    fieldKey={key}
                    definition={definition}
                    title={fieldLabel(key, definition)}
                  />
                </button>

                {isSelected && (
                  <>
                    <Input
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) =>
                        onParameterChange(key, event.target.value)
                      }
                      className="mt-4"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          onFileChange(key, file);
                        }
                      }}
                      className="mt-3 block w-full text-sm text-secondary"
                    />
                  </>
                )}
              </div>
            );
          }

          if (definition.type === "boolean") {
            return (
              <label
                key={key}
                className={`flex items-center justify-between gap-4 ${cardClass(
                  isSelected,
                )}`}
              >
                <div>
                  <FieldHeader
                    fieldKey={key}
                    definition={definition}
                    title={fieldLabel(key, definition)}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    onParameterChange(key, event.target.checked)
                  }
                  onClick={() => onSelectField(key)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
              </label>
            );
          }

          return (
            <div key={key} className={cardClass(isSelected)}>
              <button
                type="button"
                onClick={() => onSelectField(key)}
                className="w-full text-left"
              >
                <FieldHeader
                  fieldKey={key}
                  definition={definition}
                  title={fieldLabel(key, definition)}
                />
              </button>

              {isSelected && (
                <Input
                  value={
                    typeof value === "string" || typeof value === "number"
                      ? String(value)
                      : ""
                  }
                  onChange={(event) => onParameterChange(key, event.target.value)}
                  className="mt-4"
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
