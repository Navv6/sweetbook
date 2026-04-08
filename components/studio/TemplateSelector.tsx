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
            className={`w-full rounded-xl px-5 py-5 text-left transition ${
              isSelected
                ? "bg-surface-container-highest"
                : "bg-surface-container-low hover:bg-surface-container-high"
            }`}
          >
            <div className="flex items-start gap-4">
              {template.thumbnailUrl && (
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="h-20 w-16 flex-shrink-0 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {template.name}
                  </p>
                  <div
                    className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: template.accentColor }}
                  />
                </div>
                <p className="editorial-copy mt-2 text-sm">
                  {template.description}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-secondary">
                  {template.coverLabel}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
