"use client";

import { useEffect, useRef, useState } from "react";

import type {
  TemplateKind,
  TemplateLayoutElement,
  TemplateSchema,
  TemplateVariant,
} from "@/types/project";

/* 커스텀 템플릿 이름에서 날짜 부분을 제거해 읽기 좋게 표시 */
const displayName = (name: string) =>
  name.replace(/_custom_\d+$/, "").replace(/_custom_/, "").trim();

const kindLabel: Record<TemplateKind, string> = {
  cover: "표지",
  content: "내지",
  divider: "구분",
  publish: "출판",
};

export function CustomTemplateModal({
  isOpen,
  bookSpecId,
  templateKind,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  bookSpecId: string;
  templateKind: TemplateKind;
  onApply: (elements: TemplateLayoutElement[], schema: TemplateSchema) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<TemplateVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch("/api/templates/custom")
      .then((r) => r.json())
      .then((data: { templates?: TemplateVariant[]; message?: string }) => {
        if (data.templates) {
          setTemplates(data.templates);
        } else {
          setError(data.message ?? "불러오기 실패");
        }
      })
      .catch(() => setError("네트워크 오류"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleApply = async (variant: TemplateVariant) => {
    setApplying(variant.id);
    try {
      const res = await fetch(`/api/templates/custom/${variant.id}`);
      const data = (await res.json()) as { schema?: TemplateSchema; message?: string };
      if (!data.schema) throw new Error(data.message ?? "스키마 없음");
      onApply(data.schema.layout.elements, data.schema);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "적용 실패");
    } finally {
      setApplying(null);
    }
  };

  /* 현재 페이지와 bookSpecId + templateKind 이 맞는 것만 표시 */
  const matched = templates.filter(
    (t) => t.bookSpecId === bookSpecId && t.templateKind === templateKind,
  );
  const others = templates.filter(
    (t) => !(t.bookSpecId === bookSpecId && t.templateKind === templateKind),
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="mx-auto mt-20 w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="section-label">내 템플릿</p>
            <p className="display-copy mt-2 text-2xl text-foreground">
              저장된 레이아웃 불러오기
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-secondary transition hover:bg-surface-container"
          >
            ×
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-secondary">불러오는 중…</p>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && templates.length === 0 && (
          <p className="py-8 text-center text-sm text-secondary">
            저장된 커스텀 템플릿이 없습니다.
          </p>
        )}

        {!loading && matched.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              현재 페이지와 호환
            </p>
            {matched.map((t) => (
              <TemplateRow
                key={t.id}
                variant={t}
                applying={applying === t.id}
                onApply={() => handleApply(t)}
              />
            ))}
          </div>
        )}

        {!loading && others.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              다른 판형 / 종류
            </p>
            {others.map((t) => (
              <TemplateRow
                key={t.id}
                variant={t}
                applying={applying === t.id}
                onApply={() => handleApply(t)}
                dimmed
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateRow({
  variant,
  applying,
  onApply,
  dimmed = false,
}: {
  variant: TemplateVariant;
  applying: boolean;
  onApply: () => void;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border border-outline/20 bg-surface-container-low px-5 py-4 transition ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {displayName(variant.name)}
        </p>
        <p className="mt-0.5 text-xs text-secondary">
          {`${kindLabel[variant.templateKind] ?? variant.templateKind} · ${variant.bookSpecId} · ${variant.theme}`}
        </p>
      </div>
      <button
        type="button"
        disabled={applying}
        onClick={onApply}
        className="ml-4 shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80 disabled:opacity-50"
      >
        {applying ? "적용 중…" : "적용"}
      </button>
    </div>
  );
}
