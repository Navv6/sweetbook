import Image from "next/image";

import type { TemplateOption } from "@/types/project";

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: TemplateOption[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const isSelected = template.id === selectedTemplateId;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`w-full rounded-2xl border px-5 py-5 text-left transition ${
              isSelected
                ? "border-primary/30 bg-surface-container-highest"
                : "border-transparent bg-surface-container-low hover:border-outline hover:bg-surface-container-high"
            }`}
          >
            <div className="flex items-start gap-4">
              {template.thumbnailUrl ? (
                <Image
                  src={template.thumbnailUrl}
                  alt={template.name}
                  width={72}
                  height={96}
                  className="h-24 w-[4.5rem] flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-[4.5rem] flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                  No Cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {template.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-secondary">
                      {template.coverLabel}
                    </p>
                  </div>
                  <div
                    className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: template.accentColor }}
                  />
                </div>

                <p className="editorial-copy mt-3 text-sm">
                  {template.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {template.templateKinds.map((kind) => (
                    <span
                      key={`${template.id}-${kind}`}
                      className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary"
                    >
                      {kind}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-xs text-secondary">
                  {`${template.templateCount} templates in this family`}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
