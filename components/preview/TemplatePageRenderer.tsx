"use client";

import type { CSSProperties } from "react";

import { sanitizeDisplayImageUrl } from "@/lib/media";
import { resolveTemplateValue } from "@/lib/template-catalog";
import type {
  GeneratedPage,
  TemplateLayoutElement,
  TemplateParameterValue,
} from "@/types/project";

const hasRenderableSchema = (
  page: GeneratedPage,
): page is GeneratedPage & {
  schema: NonNullable<GeneratedPage["schema"]>;
} =>
  Boolean(
    page &&
      page.schema &&
      page.schema.layout &&
      Array.isArray(page.schema.layout.elements),
  );

const findParameterKeys = (value?: string | boolean) => {
  if (typeof value !== "string") {
    return [];
  }

  return Array.from(value.matchAll(/\$\$([A-Za-z0-9_]+)\$\$/g)).map(
    (match) => match[1],
  );
};

const resolveObjectFit = (fit?: string) => {
  switch (fit?.toLowerCase()) {
    case "contain":
      return "contain";
    case "fill":
      return "fill";
    case "cover":
    default:
      return "cover";
  }
};

const hexToCssColor = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("#") && value.length === 9) {
    const a = parseInt(value.slice(1, 3), 16) / 255;
    const r = parseInt(value.slice(3, 5), 16);
    const g = parseInt(value.slice(5, 7), 16);
    const b = parseInt(value.slice(7, 9), 16);
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }

  return value;
};

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const elementStyle = (
  page: GeneratedPage,
  element: TemplateLayoutElement,
): CSSProperties => ({
  position: "absolute",
  left: toPercent(element.position.x, page.schema.layout.width),
  top: toPercent(element.position.y, page.schema.layout.height),
  width:
    typeof element.width === "number"
      ? toPercent(element.width, page.schema.layout.width)
      : undefined,
  height:
    typeof element.height === "number"
      ? toPercent(element.height, page.schema.layout.height)
      : undefined,
  borderRadius:
    typeof element.cornerRadius === "number"
      ? `${element.cornerRadius}px`
      : typeof element.frame?.cornerRadius === "number"
        ? `${element.frame.cornerRadius}px`
        : undefined,
  backgroundColor:
    hexToCssColor(element.backgroundColor) ?? hexToCssColor(element.color),
  color: hexToCssColor(element.textBrush),
  fontFamily: element.fontFamily,
  fontSize:
    typeof element.fontSize === "number"
      ? `${Math.max(10, element.fontSize * 0.6)}px`
      : undefined,
  fontWeight: element.textBold ? 700 : undefined,
  lineHeight:
    typeof element.textLineHeight === "number"
      ? `${Math.max(14, element.textLineHeight * 0.55)}px`
      : undefined,
  textAlign:
    element.textAlignment?.toLowerCase() === "center"
      ? "center"
      : element.textAlignment?.toLowerCase() === "right"
        ? "right"
        : "left",
  display: "flex",
  alignItems:
    element.verticalAlignment?.toLowerCase() === "center"
      ? "center"
      : "flex-start",
  justifyContent:
    element.textAlignment?.toLowerCase() === "center"
      ? "center"
      : element.textAlignment?.toLowerCase() === "right"
        ? "flex-end"
        : "flex-start",
  overflow: "hidden",
  padding: "2px 4px",
});

const isVisible = (
  value: string | boolean | undefined,
  parameters: Record<string, TemplateParameterValue>,
  pageNumber: number,
) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (!value) {
    return true;
  }

  const resolved = resolveTemplateValue(value, parameters, pageNumber);
  if (resolved === "false" || resolved === "") {
    return false;
  }

  return resolved !== "0";
};

const resolveFileSource = (
  value: string | undefined,
  parameters: Record<string, TemplateParameterValue>,
  pageNumber: number,
) => {
  if (!value) {
    return "";
  }

  const resolved = resolveTemplateValue(value, parameters, pageNumber);
  return typeof resolved === "string"
    ? (sanitizeDisplayImageUrl(resolved) ?? "")
    : "";
};

function RenderElement({
  page,
  element,
  selectedFieldKey,
  onSelectField,
}: {
  page: GeneratedPage;
  element: TemplateLayoutElement;
  selectedFieldKey?: string | null;
  onSelectField?: (fieldKey: string | null) => void;
}) {
  const textKeys = findParameterKeys(element.text);
  const imageKeys = findParameterKeys(element.imageSource);
  const fileKeys = findParameterKeys(element.fileName);
  const photoKeys = findParameterKeys(element.photos);
  const keys = [
    ...new Set([...textKeys, ...imageKeys, ...fileKeys, ...photoKeys]),
  ];
  const activeKey = keys[0] ?? null;

  if (!isVisible(element.visible, page.parameters, page.pageNumber)) {
    return null;
  }

  const isSelected = activeKey !== null && activeKey === selectedFieldKey;
  const clickable =
    typeof onSelectField === "function" &&
    activeKey &&
    activeKey in page.schema.parameterDefinitions;

  const sharedStyle = {
    ...elementStyle(page, element),
    outline: isSelected ? "2px solid rgba(37, 99, 235, 0.65)" : undefined,
    cursor: clickable ? "pointer" : "default",
  };

  if (element.type === "rectangle") {
    return <div style={sharedStyle} />;
  }

  if (element.type === "graphic" || element.type === "photo") {
    const src = resolveFileSource(
      element.imageSource ?? element.fileName,
      page.parameters,
      page.pageNumber,
    );
    return (
      <button
        type="button"
        onClick={() => onSelectField?.(activeKey)}
        style={sharedStyle}
        className="border-none bg-transparent p-0"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={element.element_id}
            className="h-full w-full"
            style={{ objectFit: resolveObjectFit(element.fit) }}
          />
        ) : null}
      </button>
    );
  }

  if (element.type === "rowGallery" || element.type === "columnGallery") {
    const galleryKey =
      photoKeys[0] ?? (typeof element.tag === "string" ? element.tag : null);
    const galleryValue =
      galleryKey && Array.isArray(page.parameters[galleryKey])
        ? (page.parameters[galleryKey] as string[])
        : [];
    const safeGalleryValue = galleryValue
      .map((src) => sanitizeDisplayImageUrl(src))
      .filter((src): src is string => Boolean(src));
    const gap = element.container?.itemGap ?? 8;

    return (
      <button
        type="button"
        onClick={() => onSelectField?.(galleryKey)}
        style={sharedStyle}
        className="border-none bg-transparent p-0"
      >
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns:
              element.type === "columnGallery"
                ? "minmax(0, 1fr)"
                : `repeat(${Math.max(safeGalleryValue.length, 1)}, minmax(0, 1fr))`,
            gridTemplateRows:
              element.type === "columnGallery"
                ? `repeat(${Math.max(safeGalleryValue.length, 1)}, minmax(0, 1fr))`
                : undefined,
            gap: `${gap}px`,
          }}
        >
          {safeGalleryValue.length > 0 ? (
            safeGalleryValue.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${element.element_id}-${index}`}
                src={src}
                alt={`${element.element_id}-${index}`}
                className="h-full w-full"
                style={{
                  objectFit: resolveObjectFit(element.fit),
                  borderRadius: `${element.frame?.cornerRadius ?? 8}px`,
                }}
              />
            ))
          ) : (
            <div className="h-full w-full rounded-xl border border-dashed border-outline/40 bg-surface-container-low" />
          )}
        </div>
      </button>
    );
  }

  const text = resolveTemplateValue(
    element.text ?? "",
    page.parameters,
    page.pageNumber,
  );

  return (
    <button
      type="button"
      onClick={() => onSelectField?.(activeKey)}
      style={sharedStyle}
      className="border-none bg-transparent"
    >
      <span>{text}</span>
    </button>
  );
}

export function TemplatePageRenderer({
  page,
  selectedFieldKey,
  onSelectField,
}: {
  page: GeneratedPage;
  selectedFieldKey?: string | null;
  onSelectField?: (fieldKey: string | null) => void;
}) {
  if (!hasRenderableSchema(page)) {
    return (
      <div className="flex aspect-[1/1.4] items-center justify-center rounded-[1.25rem] border border-dashed border-outline/40 bg-surface-container-low text-sm text-secondary">
        Template schema is unavailable for this page.
      </div>
    );
  }

  const baseElements =
    page.pageNumber % 2 === 0
      ? page.schema.baseLayer?.even?.elements ?? []
      : page.schema.baseLayer?.odd?.elements ?? [];
  const elements = [...baseElements, ...page.schema.layout.elements];

  return (
    <div
      className="relative overflow-hidden rounded-[1.25rem] border border-outline/30 bg-white"
      style={{
        aspectRatio: `${page.schema.layout.width} / ${page.schema.layout.height}`,
        backgroundColor:
          hexToCssColor(page.schema.layout.backgroundColor) ?? "#ffffff",
      }}
    >
      {elements.map((element) => (
        <RenderElement
          key={element.element_id}
          page={page}
          element={element}
          selectedFieldKey={selectedFieldKey}
          onSelectField={onSelectField}
        />
      ))}
    </div>
  );
}
