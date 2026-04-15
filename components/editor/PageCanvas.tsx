"use client";

import { useState } from "react";

import { CustomTemplateModal } from "@/components/editor/CustomTemplateModal";
import { FreeLayoutEditor } from "@/components/editor/FreeLayoutEditor";
import { TemplatePageRenderer } from "@/components/preview/TemplatePageRenderer";
import { getGalleryFieldsFromPage } from "@/lib/template-gallery";
import type {
  GeneratedPage,
  TemplateKind,
  TemplateLayoutElement,
  TemplateSchema,
} from "@/types/project";

export function PageCanvas({
  page,
  selectedFieldKey,
  onSelectField,
  onLayoutChange,
}: {
  page: GeneratedPage;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
  onLayoutChange?: (pageId: string, elements: TemplateLayoutElement[]) => void;
}) {
  const [freeEditMode, setFreeEditMode] = useState(false);
  const [myTemplatesOpen, setMyTemplatesOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleLayoutChange = (elements: TemplateLayoutElement[]) => {
    onLayoutChange?.(page.id, elements);
  };

  const handleSaveAsCustomTemplate = async () => {
    if (savingTemplate) return;
    setSavingTemplate(true);
    try {
      const response = await fetch("/api/templates/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page }),
      });
      const data = (await response.json().catch(() => null)) as
        | { templateUid?: string; message?: string }
        | null;
      if (!response.ok || !data?.templateUid) {
        throw new Error(data?.message ?? "템플릿 저장에 실패했습니다.");
      }
      alert("현재 레이아웃이 내 템플릿으로 저장되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "템플릿 저장에 실패했습니다.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyCustomTemplate = (
    elements: TemplateLayoutElement[],
    _schema: TemplateSchema,
  ) => {
    onLayoutChange?.(page.id, elements);
    setFreeEditMode(true); // 불러온 뒤 바로 편집 모드로 진입
  };

  const hasOverrides =
    Array.isArray(page.layoutOverrides) && page.layoutOverrides.length > 0;
  const galleryFields = getGalleryFieldsFromPage(page);
  const hasGalleryFields = galleryFields.length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">{`Page ${page.pageNumber}`}</p>
          <p className="display-copy mt-3 text-3xl text-foreground">
            {page.templateName}
          </p>
          {hasGalleryFields && (
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-secondary">
              {`Gallery template • ${galleryFields
                .map((field) => field.label)
                .join(", ")}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasGalleryFields && (
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              Gallery
            </span>
          )}
          {hasOverrides && !freeEditMode && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              커스텀 레이아웃
            </span>
          )}
          <button
            type="button"
            onClick={() => setMyTemplatesOpen(true)}
            className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-secondary transition hover:bg-surface-container hover:text-foreground"
          >
            내 템플릿
          </button>
          <button
            type="button"
            onClick={handleSaveAsCustomTemplate}
            disabled={savingTemplate}
            className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-secondary transition hover:bg-surface-container hover:text-foreground disabled:opacity-50"
          >
            {savingTemplate ? "저장 중…" : "레이아웃 저장"}
          </button>
          <button
            type="button"
            onClick={() => setFreeEditMode((v) => !v)}
            className={[
              "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition",
              freeEditMode
                ? "bg-primary text-white shadow"
                : "bg-surface-container-low text-secondary hover:bg-surface-container",
            ].join(" ")}
          >
            {freeEditMode ? "편집 완료" : "레이아웃 편집"}
          </button>
          <div className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            {page.kind}
          </div>
        </div>
      </div>

      <div className="canvas-shadow rounded-[1.75rem] bg-surface-container-lowest p-4 md:p-6">
        <div className="w-full">
          {freeEditMode ? (
            <FreeLayoutEditor
              page={page}
              onLayoutChange={handleLayoutChange}
            />
          ) : (
            <TemplatePageRenderer
              page={page}
              selectedFieldKey={selectedFieldKey}
              onSelectField={onSelectField}
            />
          )}
        </div>
      </div>

      <CustomTemplateModal
        isOpen={myTemplatesOpen}
        bookSpecId={page.schema?.bookSpecId ?? ""}
        templateKind={(page.kind ?? "content") as TemplateKind}
        onApply={handleApplyCustomTemplate}
        onClose={() => setMyTemplatesOpen(false)}
      />
    </section>
  );
}
