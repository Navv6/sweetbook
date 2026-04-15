"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

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
  if (typeof value !== "string") return [];
  return Array.from(value.matchAll(/\$\$([A-Za-z0-9_]+)\$\$/g)).map(
    (match) => match[1],
  );
};

const resolveObjectFit = (fit?: string) => {
  switch (fit?.toLowerCase()) {
    case "contain": return "contain";
    case "fill":    return "fill";
    default:        return "cover";
  }
};

const hexToCssColor = (value?: string) => {
  if (!value) return undefined;
  if (value.startsWith("#") && value.length === 9) {
    const a = parseInt(value.slice(1, 3), 16) / 255;
    const r = parseInt(value.slice(3, 5), 16);
    const g = parseInt(value.slice(5, 7), 16);
    const b = parseInt(value.slice(7, 9), 16);
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return value;
};

/**
 * All values are in native canvas coordinates (px).
 * The parent applies transform: scale() so everything stays proportional.
 */
const elementStyle = (element: TemplateLayoutElement): CSSProperties => ({
  position: "absolute",
  left: element.position.x,
  top: element.position.y,
  width:  typeof element.width  === "number" ? element.width  : undefined,
  height: typeof element.height === "number" ? element.height : undefined,
  borderRadius:
    typeof element.cornerRadius === "number"
      ? element.cornerRadius
      : typeof element.frame?.cornerRadius === "number"
        ? element.frame.cornerRadius
        : undefined,
  backgroundColor:
    hexToCssColor(element.backgroundColor) ?? hexToCssColor(element.color),
  color: hexToCssColor(element.textBrush),
  fontFamily: element.fontFamily,
  fontSize:    typeof element.fontSize       === "number" ? element.fontSize       : undefined,
  fontWeight:  element.textBold ? 700 : undefined,
  lineHeight:  typeof element.textLineHeight === "number" ? `${element.textLineHeight}px` : undefined,
  textAlign:
    element.textAlignment?.toLowerCase() === "center" ? "center"
    : element.textAlignment?.toLowerCase() === "right"  ? "right"
    : "left",
  display: "flex",
  alignItems:
    element.verticalAlignment?.toLowerCase() === "center" ? "center" : "flex-start",
  justifyContent:
    element.textAlignment?.toLowerCase() === "center" ? "center"
    : element.textAlignment?.toLowerCase() === "right"  ? "flex-end"
    : "flex-start",
  overflow: "hidden",
  padding: "4px 8px",
});

const isVisible = (
  value: string | boolean | undefined,
  parameters: Record<string, TemplateParameterValue>,
  pageNumber: number,
) => {
  if (typeof value === "boolean") return value;
  if (!value) return true;
  const resolved = resolveTemplateValue(value, parameters, pageNumber);
  if (resolved === "false" || resolved === "") return false;
  return resolved !== "0";
};

const resolveFileSource = (
  value: string | undefined,
  parameters: Record<string, TemplateParameterValue>,
  pageNumber: number,
) => {
  if (!value) return "";
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
  const textKeys  = findParameterKeys(element.text);
  const imageKeys = findParameterKeys(element.imageSource);
  const fileKeys  = findParameterKeys(element.fileName);
  const photoKeys = findParameterKeys(element.photos);
  const keys = [...new Set([...textKeys, ...imageKeys, ...fileKeys, ...photoKeys])];
  const activeKey = keys[0] ?? null;

  if (!isVisible(element.visible, page.parameters, page.pageNumber)) return null;

  const isSelected = activeKey !== null && activeKey === selectedFieldKey;
  const clickable  =
    typeof onSelectField === "function" &&
    activeKey &&
    activeKey in page.schema.parameterDefinitions;

  const sharedStyle: CSSProperties = {
    ...elementStyle(element),
    outline: clickable
      ? isSelected
        ? "2px solid rgba(37, 99, 235, 0.8)"
        : "1px solid rgba(148, 163, 184, 0.5)"
      : undefined,
    cursor: clickable ? "pointer" : "default",
    boxShadow: clickable
      ? isSelected
        ? "inset 0 0 0 9999px rgba(59, 130, 246, 0.08)"
        : "inset 0 0 0 9999px rgba(15, 23, 42, 0.03)"
      : undefined,
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
    // custom elements store image directly in imageSource as data URL
    const directSrc =
      !src && typeof element.imageSource === "string" && element.imageSource.startsWith("data:")
        ? element.imageSource
        : src;
    return (
      <button
        type="button"
        onClick={() => onSelectField?.(activeKey)}
        style={sharedStyle}
        className="border-none bg-transparent p-0"
      >
        {directSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={directSrc}
            alt={element.element_id}
            className="h-full w-full"
            style={{ objectFit: resolveObjectFit(element.fit) }}
          />
        ) : null}
      </button>
    );
  }

  if (
    element.type === "rowGallery" ||
    element.type === "columnGallery" ||
    element.type === "collageGallery"
  ) {
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
    const collageCount = Math.max(Math.min(safeGalleryValue.length, 4), 1);
    const collageColumns = collageCount === 1 ? 1 : 2;

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
                : element.type === "collageGallery"
                  ? `repeat(${collageColumns}, minmax(0, 1fr))`
                : `repeat(${Math.max(safeGalleryValue.length, 1)}, minmax(0, 1fr))`,
            gridTemplateRows:
              element.type === "columnGallery"
                ? `repeat(${Math.max(safeGalleryValue.length, 1)}, minmax(0, 1fr))`
                : element.type === "collageGallery"
                  ? `repeat(${Math.ceil(collageCount / collageColumns)}, minmax(0, 1fr))`
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const canvasW = page?.schema?.layout?.width  ?? 1;
  const canvasH = page?.schema?.layout?.height ?? 1;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / canvasW);
    });
    ro.observe(el);
    // set initial scale synchronously
    setScale(el.getBoundingClientRect().width / canvasW);
    return () => ro.disconnect();
  }, [canvasW]);

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

  const mainElements = page.layoutOverrides ?? page.schema.layout.elements;
  const elements = [...baseElements, ...mainElements];

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-[1.25rem] border border-outline/30"
      style={{
        aspectRatio: `${canvasW} / ${canvasH}`,
        backgroundColor: hexToCssColor(page.schema.layout.backgroundColor) ?? "#ffffff",
      }}
    >
      {/* Inner canvas rendered at native canvas size, then scaled to fit wrapper */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: canvasW,
          height: canvasH,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
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
    </div>
  );
}
