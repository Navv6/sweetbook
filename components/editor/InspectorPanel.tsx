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

const FIELD_LABEL_MAP: Record<string, string> = {
  monthYearLabel: "연도",
  monthDayLabel: "월/일",
  dayMonthLabel: "월/일",
  dateLabel: "날짜",
  dateRange: "날짜 범위",
  title: "제목",
  subtitle: "부제목",
  photo: "메인 사진",
  coverPhoto: "표지 사진",
  frontPhoto: "앞표지 사진",
  backPhoto: "뒷표지 사진",
  collagePhotos: "사진",
  galleryPhotos: "사진",
};

const FIELD_EXAMPLE_MAP: Record<string, string> = {
  monthYearLabel: "(예: 2026)",
  monthDayLabel: "(예: 4/9)",
  dayMonthLabel: "(예: 4/9)",
  dateLabel: "(예: 2026.04.15)",
  dateRange: "(예: 26.01 - 27.03)",
  title: "(예: 나의 하루 기록)",
  subtitle: "(예: 소중한 순간들)",
  startEndMonthYear: "(예: 2026년 1월 - 6월)",
};

// 제목(description) 기반 예시 fallback
const TITLE_EXAMPLE_MAP: Record<string, string> = {
  "시작/끝 월+연도": "(예: 2026년 1월 - 6월)",
  "연도": "(예: 2026)",
  "월/일": "(예: 4/9)",
  "날짜": "(예: 2026.04.15)",
  "날짜 범위": "(예: 26.01 - 27.03)",
  "제목": "(예: 나의 하루 기록)",
};

const fieldLabel = (key: string, definition: TemplateParameterDefinition) => {
  let raw = definition.description?.trim() || FIELD_LABEL_MAP[key] || key;
  if (/갤러리.*사진/.test(raw)) return "사진";
  // "라벨" 접미사 제거 (예: "월/일 라벨" → "월/일")
  raw = raw.replace(/\s*라벨$/g, "");
  return raw;
};

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
  // "(예: ...)" 부분을 분리 — 영문/코드 예시는 한글 매핑으로 대체
  const exampleMatch = title.match(/^(.+?)\s*(\(예[::].+\))$/s);
  const mainTitle = exampleMatch ? exampleMatch[1].trim() : title;
  const rawCaption = exampleMatch ? exampleMatch[2] : null;
  // 영문/코드형 예시는 한글 예시 매핑으로 대체
  const isEnglishExample = rawCaption && /[A-Z]{2,}|\\n|'[A-Z]/.test(rawCaption);
  const exampleCaption = isEnglishExample
    ? (FIELD_EXAMPLE_MAP[fieldKey] ?? TITLE_EXAMPLE_MAP[mainTitle] ?? null)
    : (rawCaption ?? FIELD_EXAMPLE_MAP[fieldKey] ?? TITLE_EXAMPLE_MAP[mainTitle] ?? null);

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-foreground">{mainTitle}</p>
        {exampleCaption && (
          <p className="mt-0.5 text-[11px] text-secondary/70">{exampleCaption}</p>
        )}
      </div>
      {trailing}
    </div>
  );
}

export function InspectorPanel({
  page,
  selectedFieldKey,
  onSelectField,
  onParameterChange,
  onFileChange,
  totalPhotoCount,
  className = "",
}: {
  page: GeneratedPage | null;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
  onParameterChange: (fieldKey: string, value: TemplateParameterValue) => void;
  onFileChange: (fieldKey: string, file: File, index?: number) => void;
  totalPhotoCount?: number;
  className?: string;
}) {
  if (!page) {
    return (
      <aside className={`glass-panel rounded-[1.75rem] p-6 ${className}`}>
        <p className="text-lg font-semibold text-foreground">편집 항목</p>
      </aside>
    );
  }

  const entries = Object.entries(page.schema.parameterDefinitions);

  return (
    <aside className={`glass-panel rounded-[1.75rem] p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground">편집 매개</p>
        <span className="text-xs uppercase tracking-[0.18em] text-secondary">
          {entries.length}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-surface-container-low p-5">
        <p className="display-copy text-2xl text-foreground">
          {page.templateName.replace(/\s*\(.*?\)\s*/g, " ").trim()}
        </p>
        <p className="editorial-copy mt-2 text-sm">
          {page.schema.theme}
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
                      <span className="rounded-md border border-outline/20 bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-secondary">
                        {gallery.length}장
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
                                {`사진 ${index + 1}`}
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
                                삭제
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
                              <label className="mt-2 inline-flex cursor-pointer items-center rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-semibold tracking-[0.16em] text-secondary transition hover:bg-surface-container hover:text-foreground">
                                사진 첨부
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                      onFileChange(key, file, index);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-lowest px-4 py-3 text-xs text-secondary">
                          사진을 추가하여 갤러리를 구성하세요.
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
                      첨부
                    </button>

                    <div className="mt-3 text-xs text-secondary">
                      {isRowGallery
                        ? `권장 ${RECOMMENDED_ROW_GALLERY_ITEMS}장. 1~${MAX_ROW_GALLERY_ITEMS}장 추가 가능.`
                        : isCollageGallery
                          ? `권장 ${RECOMMENDED_COLLAGE_GALLERY_ITEMS}장. 1~${MAX_COLLAGE_GALLERY_ITEMS}장 추가 가능.`
                          : "1장 이상의 사진을 추가할 수 있습니다."}
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
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-semibold tracking-[0.16em] text-secondary transition hover:bg-surface-container hover:text-foreground">
                      사진 첨부
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            onFileChange(key, file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
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

          // "사진 수" 필드는 전체 프로젝트의 이미지 수를 자동 집계
          const label = fieldLabel(key, definition);
          const isPhotoCount = /사진\s*수/.test(label) || /photoCount/i.test(key);
          const isPublisher = /제작사/.test(label) || /publisher/i.test(key);

          if (isPhotoCount && totalPhotoCount !== undefined) {
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
                    title={label}
                  />
                </button>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {totalPhotoCount}장
                </p>
              </div>
            );
          }

          if (isPublisher) {
            return (
              <div key={key} className={cardClass(isSelected)}>
                <FieldHeader
                  fieldKey={key}
                  definition={definition}
                  title={label}
                />
                <p className="mt-3 text-sm text-foreground">(주)스위트북</p>
              </div>
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
