import { TemplatePageRenderer } from "@/components/preview/TemplatePageRenderer";
import type { GeneratedPage } from "@/types/project";

export function PageCanvas({
  page,
  selectedFieldKey,
  onSelectField,
}: {
  page: GeneratedPage;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
}) {
  const pageAspectRatio =
    page.schema?.layout?.width && page.schema?.layout?.height
      ? page.schema.layout.width / page.schema.layout.height
      : 1 / 1.4;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">{`Page ${page.pageNumber}`}</p>
          <p className="display-copy mt-3 text-3xl italic text-foreground">
            {page.templateName}
          </p>
        </div>
        <div className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {page.kind}
        </div>
      </div>

      <div className="canvas-shadow rounded-[1.75rem] bg-surface-container-lowest p-4 md:p-6">
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: `min(100%, calc((100vh - 240px) * ${pageAspectRatio}))`,
          }}
        >
          <TemplatePageRenderer
            page={page}
            selectedFieldKey={selectedFieldKey}
            onSelectField={onSelectField}
          />
        </div>
      </div>
    </section>
  );
}
