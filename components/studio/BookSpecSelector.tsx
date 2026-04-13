import type { BookSpecOption } from "@/types/project";

const formatBookSpecMeta = (bookSpec: BookSpecOption) =>
  `${bookSpec.width} x ${bookSpec.height} mm · ${bookSpec.minPages}-${bookSpec.maxPages}p · +${bookSpec.pageStep}p`;

export function BookSpecSelector({
  bookSpecs,
  selectedBookSpecId,
  onSelect,
}: {
  bookSpecs: BookSpecOption[];
  selectedBookSpecId: string;
  onSelect: (bookSpecId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {bookSpecs.map((bookSpec) => {
        const isSelected = bookSpec.id === selectedBookSpecId;

        return (
          <button
            key={bookSpec.id}
            type="button"
            onClick={() => onSelect(bookSpec.id)}
            className={`w-full rounded-xl border px-5 py-5 text-left transition ${
              isSelected
                ? "border-primary/30 bg-surface-container-highest"
                : "border-transparent bg-surface-container-low hover:border-outline hover:bg-surface-container-high"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {bookSpec.name}
                </p>
                <p className="editorial-copy mt-2 text-sm">
                  {formatBookSpecMeta(bookSpec)}
                </p>
              </div>
              <div className="rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-secondary">
                {`${bookSpec.width}×${bookSpec.height}`}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
