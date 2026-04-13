import { Input } from "@/components/ui/Input";
import type {
  GeneratedPage,
  TemplateParameterDefinition,
  TemplateParameterValue,
} from "@/types/project";

const fieldLabel = (key: string, definition: TemplateParameterDefinition) =>
  definition.description?.trim() || key;

export function InspectorPanel({
  page,
  selectedFieldKey,
  onSelectField,
  onParameterChange,
  onFileChange,
}: {
  page: GeneratedPage | null;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
  onParameterChange: (fieldKey: string, value: TemplateParameterValue) => void;
  onFileChange: (fieldKey: string, file: File, index?: number) => void;
}) {
  if (!page) {
    return (
      <aside className="glass-panel rounded-[1.75rem] p-6">
        <p className="section-label">Inspector</p>
      </aside>
    );
  }

  const entries = Object.entries(page.schema.parameterDefinitions);

  return (
    <aside className="glass-panel rounded-[1.75rem] p-6">
      <p className="section-label">Inspector</p>
      <div className="mt-4 rounded-2xl bg-surface-container-low p-5">
        <p className="display-copy text-2xl italic text-foreground">
          {page.templateName}
        </p>
        <p className="editorial-copy mt-2 text-sm">
          {`${page.schema.theme} · ${page.schema.bookSpecId}`}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {entries.map(([key, definition]) => {
          const value = page.parameters[key];
          const isSelected = selectedFieldKey === key;

          if (
            definition.binding === "rowGallery" ||
            definition.binding === "columnGallery"
          ) {
            const gallery = Array.isArray(value) ? value : [];
            return (
              <div
                key={key}
                className={`rounded-2xl p-5 transition ${
                  isSelected
                    ? "bg-surface-container-highest"
                    : "bg-surface-container-low"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectField(key)}
                  className="w-full text-left"
                >
                  <p className="section-label">{fieldLabel(key, definition)}</p>
                  <p className="mt-2 text-xs text-secondary">
                    {`${gallery.length} image slot${gallery.length === 1 ? "" : "s"}`}
                  </p>
                </button>
                <div className="mt-4 grid gap-3">
                  {gallery.map((item, index) => (
                    <div key={`${key}-${index}`} className="space-y-2">
                      <Input
                        value={item}
                        onChange={(event) => {
                          const next = [...gallery];
                          next[index] = event.target.value;
                          onParameterChange(key, next);
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            onFileChange(key, file, index);
                          }
                        }}
                        className="block w-full text-sm text-secondary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (definition.binding === "file") {
            return (
              <div
                key={key}
                className={`rounded-2xl p-5 transition ${
                  isSelected
                    ? "bg-surface-container-highest"
                    : "bg-surface-container-low"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectField(key)}
                  className="w-full text-left"
                >
                  <p className="section-label">{fieldLabel(key, definition)}</p>
                </button>
                <Input
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => onParameterChange(key, event.target.value)}
                  className="mt-4"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onFileChange(key, file);
                    }
                  }}
                  className="mt-3 block w-full text-sm text-secondary"
                />
              </div>
            );
          }

          if (definition.type === "boolean") {
            return (
              <label
                key={key}
                className={`flex items-center justify-between rounded-2xl p-5 transition ${
                  isSelected
                    ? "bg-surface-container-highest"
                    : "bg-surface-container-low"
                }`}
              >
                <div>
                  <p className="section-label">{fieldLabel(key, definition)}</p>
                  <p className="mt-2 text-xs text-secondary">{key}</p>
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

          return (
            <div
              key={key}
              className={`rounded-2xl p-5 transition ${
                isSelected
                  ? "bg-surface-container-highest"
                  : "bg-surface-container-low"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectField(key)}
                className="w-full text-left"
              >
                <p className="section-label">{fieldLabel(key, definition)}</p>
              </button>
              <Input
                value={
                  typeof value === "string" || typeof value === "number"
                    ? String(value)
                    : ""
                }
                onChange={(event) => onParameterChange(key, event.target.value)}
                className="mt-4"
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
