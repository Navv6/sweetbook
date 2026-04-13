import type { GeneratedSection } from "@/types/project";

export function SectionList({
  sections,
  selectedSectionId,
  onSelect,
  onMove,
  onDuplicate,
}: {
  sections: GeneratedSection[];
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, direction: "up" | "down") => void;
  onDuplicate: (sectionId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        const page = section.pages[0];
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
              <p className="section-label">{`${page?.pageNumber ?? index + 1}페이지`}</p>
              <p className="mt-3 text-base font-semibold text-foreground">
                {section.title}
              </p>
              <p className="editorial-copy mt-2 text-sm">{section.intro}</p>
            </button>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                aria-label="위로 이동"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-secondary transition hover:bg-surface-container-high"
                onClick={() => onMove(section.id, "up")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3M3.5 6.5L7 3L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="아래로 이동"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-secondary transition hover:bg-surface-container-high"
                onClick={() => onMove(section.id, "down")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3V11M10.5 7.5L7 11L3.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="섹션 복제"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-secondary transition hover:bg-surface-container-high"
                onClick={() => onDuplicate(section.id)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
