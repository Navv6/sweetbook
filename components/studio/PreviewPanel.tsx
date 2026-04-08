import type { BookSpecOption, TemplateOption } from "@/types/project";

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
  const previewTitle = title.trim() || "\uC81C\uBAA9 \uC5C6\uB294 \uAE30\uB85D";

  return (
    <aside className="glass-panel sticky top-28 rounded-[2rem] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">
            {"\uD504\uB9AC\uBDF0 \uBAA8\uB178\uADF8\uB798\uD504"}
          </p>
          <p className="display-copy mt-3 text-2xl italic">{template.name}</p>
        </div>
        <div className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-secondary">
          {bookSpec.name}
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] bg-surface-container-high p-5">
        <div className="canvas-shadow rounded-[1.6rem] bg-surface-container-lowest p-6">
          <div
            className="relative overflow-hidden rounded-[1.25rem] bg-surface-container-low"
            style={{ aspectRatio }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${coverImageUrl ?? "/demo/cover-morning.svg"})`,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,27,52,0.08),rgba(13,27,52,0.62))]" />
            <div className="relative flex h-full flex-col justify-between p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  {template.coverLabel}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/70">
                  {`${Math.max(imageCount, 6)} stills`}
                </span>
              </div>
              <div>
                <p className="display-copy text-4xl leading-[0.96] font-semibold">
                  {previewTitle}
                </p>
                <p className="mt-4 max-w-xs text-sm leading-7 text-white/80">
                  {
                    "\uAC00\uC7A5 \uD070 \uCEE4\uBC84 \uC774\uBBF8\uC9C0\uC640 \uD45C\uC9C0 \uCE74\uD53C\uB97C \uAE30\uC900\uC73C\uB85C \uC5D0\uB514\uD1A0\uB9AC\uC5BC \uCD08\uC548\uC774 \uC870\uD569\uB429\uB2C8\uB2E4."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-low p-5">
          <p className="section-label">
            {"\uD310\uD615"}
          </p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {bookSpec.description}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-5">
          <p className="section-label">
            {"\uCEE8\uD150\uCE20"}
          </p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {`\uD604\uC7AC ${imageCount}\uC7A5 \uC120\uD0DD`}
          </p>
        </div>
      </div>
    </aside>
  );
}
