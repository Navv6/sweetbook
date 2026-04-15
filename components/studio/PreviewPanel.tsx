import type { ReactNode } from "react";

import type { BookSpecOption, TemplateOption } from "@/types/project";

const formatBookSpecSize = (bookSpec: BookSpecOption) =>
  `${bookSpec.width} x ${bookSpec.height} mm`;

const formatBookSpecPages = (bookSpec: BookSpecOption) =>
  `${bookSpec.minPages}–${bookSpec.maxPages}페이지 | +${bookSpec.pageStep} 단위`;

export function PreviewPanel({
  template,
  bookSpec,
  headerAction,
}: {
  template: TemplateOption;
  bookSpec: BookSpecOption;
  headerAction?: ReactNode;
}) {
  const aspectRatio = `${bookSpec.width} / ${bookSpec.height}`;

  return (
    <div className="glass-panel rounded-[2rem] p-5 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">미리보기</p>
          <p className="display-copy mt-3 text-2xl">{template.name}</p>
        </div>
        {headerAction}
      </div>

      <div className="mt-6 rounded-[2rem] bg-surface-container-high p-3 md:p-4">
        <div className="canvas-shadow rounded-[1.6rem] bg-surface-container-lowest p-4 md:p-5">
          <div
            className="relative overflow-hidden rounded-[1.25rem] bg-surface-container-low"
            style={{ aspectRatio }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&auto=format&fit=crop)`,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,27,52,0.08),rgba(13,27,52,0.62))]" />
            <div className="relative flex h-full flex-col justify-between p-5 text-white md:p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  {template.coverLabel}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  {bookSpec.name}
                </span>
              </div>
              <div>
                <p className="display-copy text-4xl leading-[0.96] font-semibold">
                  {template.name}
                </p>
                <p className="mt-4 max-w-xs text-sm leading-7 text-white/80">
                  선택한 테마 패밀리와 판형 기반으로 에디토리얼 페이지가 조합됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
