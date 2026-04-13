import { sanitizeDisplayImageUrl } from "@/lib/media";
import type { BookSpecOption, TemplateOption } from "@/types/project";

const formatBookSpecSize = (bookSpec: BookSpecOption) =>
  `${bookSpec.width} x ${bookSpec.height} mm`;

const formatBookSpecPages = (bookSpec: BookSpecOption) =>
  `${bookSpec.minPages}–${bookSpec.maxPages}페이지 | +${bookSpec.pageStep} 단위`;

export function PreviewPanel({
  title,
  template,
  bookSpec,
  coverImageUrl,
  imageCount,
}: {
  title: string;
  template: TemplateOption;
  bookSpec: BookSpecOption;
  coverImageUrl?: string;
  imageCount: number;
}) {
  const aspectRatio = `${bookSpec.width} / ${bookSpec.height}`;
  const previewTitle = title.trim() || "제목 없는 기록";
  const previewCoverImageUrl =
    sanitizeDisplayImageUrl(coverImageUrl) ?? "/demo/cover-morning.svg";

  return (
    <aside className="glass-panel sticky top-28 rounded-[2rem] p-5 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">프리뷰 모노그래프</p>
          <p className="display-copy mt-3 text-2xl italic">{template.name}</p>
        </div>
        <div className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-secondary">
          {bookSpec.name}
        </div>
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
                backgroundImage: `url(${previewCoverImageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,27,52,0.08),rgba(13,27,52,0.62))]" />
            <div className="relative flex h-full flex-col justify-between p-5 text-white md:p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  {template.coverLabel}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/70">
                  {`${Math.max(imageCount, 6)}장`}
                </span>
              </div>
              <div>
                <p className="display-copy text-4xl leading-[0.96] font-semibold">
                  {previewTitle}
                </p>
                <p className="mt-4 max-w-xs text-sm leading-7 text-white/80">
                  가장 큰 커버 이미지와 표지 카피를 기준으로 에디토리얼 초안이 조합됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-low p-5">
          <p className="section-label">판형</p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {bookSpec.name}
          </p>
          <p className="editorial-copy mt-2 text-sm text-secondary">
            {formatBookSpecSize(bookSpec)}
          </p>
          <p className="editorial-copy mt-1 text-sm text-secondary">
            {formatBookSpecPages(bookSpec)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-5">
          <p className="section-label">컨텐츠</p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {`현재 ${imageCount}장 선택`}
          </p>
        </div>
      </div>
    </aside>
  );
}
