import type { GeneratedSection } from "@/types/project";

export function SectionList({
  sections,
  selectedSectionId,
  onSelect,
  onMove,
}: {
  sections: GeneratedSection[];
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, direction: "up" | "down") => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isSelected = selectedSectionId === section.id;

        return (
          <div
            key={section.id}
            className={`rounded-xl px-4 py-4 transition ${
              isSelected
                ? "bg-surface-container-highest"
                : "bg-transparent hover:bg-surface-container-low"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(section.id)}
              className="w-full text-left"
            >
              <p className="section-label">{`Section ${index + 1}`}</p>
              <p className="mt-3 text-base font-semibold text-foreground">
                {section.title}
              </p>
              <p className="editorial-copy mt-2 text-sm">{section.intro}</p>
            </button>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-md bg-surface-container-low px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-surface-container-high"
                onClick={() => onMove(section.id, "up")}
              >
                {"\uC704\uB85C"}
              </button>
              <button
                type="button"
                className="rounded-md bg-surface-container-low px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-surface-container-high"
                onClick={() => onMove(section.id, "down")}
              >
                {"\uC544\uB798\uB85C"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
