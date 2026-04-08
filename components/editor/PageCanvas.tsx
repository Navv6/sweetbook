import type { GeneratedPage, PageElement } from "@/types/project";

const cropStyle = (element: Extract<PageElement, { type: "image" }>) => ({
  transform: `scale(${element.crop.scale}) translate(${(0.5 - element.crop.x) * 35}%, ${(0.5 - element.crop.y) * 35}%)`,
});

const spreadImage = (
  element: Extract<PageElement, { type: "image" }>,
  isSelected: boolean,
  onSelect: () => void,
  className: string,
) => (
  <button
    key={element.id}
    type="button"
    onClick={onSelect}
    className={`relative overflow-hidden rounded-sm transition ${
      isSelected ? "ring-2 ring-primary/60" : ""
    } ${className}`}
  >
    <div
      className="absolute inset-0 bg-cover bg-center transition-transform"
      style={{
        backgroundImage: `url(${element.imageUrl})`,
        ...cropStyle(element),
      }}
    />
  </button>
);

const spreadText = (
  text: Extract<PageElement, { type: "text" }>,
  isSelected: boolean,
  onSelect: () => void,
  className: string,
) => (
  <button
    key={text.id}
    type="button"
    onClick={onSelect}
    className={`${className} text-left transition ${
      isSelected ? "ring-2 ring-primary/50" : ""
    }`}
  >
    {text.value}
  </button>
);

export function PageCanvas({
  page,
  selectedElementId,
  onSelectElement,
}: {
  page: GeneratedPage;
  selectedElementId: string | null;
  onSelectElement: (element: PageElement) => void;
}) {
  const images = page.elements.filter((element) => element.type === "image");
  const texts = page.elements.filter((element) => element.type === "text");
  const leadText = texts[0];
  const supportText = texts[1];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">{`Page ${page.pageNumber}`}</p>
          <p className="display-copy mt-3 text-3xl italic text-foreground">
            {({ cover: "표지", intro: "인트로", focus: "포커스", story: "스토리", gallery: "갤러리" })[page.templateKey] ?? page.templateKey}
          </p>
        </div>
        <div className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {page.kind}
        </div>
      </div>

      <div className="canvas-shadow relative aspect-[16/10] overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-y-0 left-1/2 w-12 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(13,27,52,0.05),transparent,rgba(13,27,52,0.05))]" />

        <div className="grid h-full grid-cols-2">
          <div className="relative flex h-full flex-col justify-center p-10 md:p-14">
            {page.templateKey === "cover" && images[0] && (
              <div className="absolute inset-0">
                {spreadImage(
                  images[0],
                  selectedElementId === images[0].id,
                  () => onSelectElement(images[0]),
                  "h-full w-full",
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,27,52,0.05),rgba(13,27,52,0.52))]" />
              </div>
            )}

            <div className={`relative ${page.templateKey === "cover" ? "text-white" : ""}`}>
              {leadText &&
                spreadText(
                  leadText,
                  selectedElementId === leadText.id,
                  () => onSelectElement(leadText),
                  "display-copy block max-w-md text-4xl leading-[0.98] font-semibold md:text-6xl",
                )}
              {supportText &&
                spreadText(
                  supportText,
                  selectedElementId === supportText.id,
                  () => onSelectElement(supportText),
                  "mt-6 block max-w-sm text-sm leading-8 text-inherit/80",
                )}
              {page.templateKey !== "cover" && (
                <>
                  <div className="mt-10 h-px w-24 bg-outline" />
                  <p className="mt-10 text-[10px] uppercase tracking-[0.32em] text-secondary">
                    {"Monograph Draft"}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="relative flex h-full flex-col justify-between p-10 md:p-14">
            {page.templateKey === "gallery" ? (
              <>
                <div className="grid h-[62%] grid-cols-2 gap-5">
                  {images.map((image) =>
                    spreadImage(
                      image,
                      selectedElementId === image.id,
                      () => onSelectElement(image),
                      "h-full",
                    ),
                  )}
                </div>
                {texts.slice(0, 1).map((text) =>
                  spreadText(
                    text,
                    selectedElementId === text.id,
                    () => onSelectElement(text),
                    "mt-8 block max-w-sm text-sm leading-8 text-muted",
                  ),
                )}
              </>
            ) : (
              <>
                {images[0] &&
                  spreadImage(
                    images[0],
                    selectedElementId === images[0].id,
                    () => onSelectElement(images[0]),
                    "h-[64%]",
                  )}
                <div className="mt-8 flex items-end gap-6">
                  {images[1] &&
                    spreadImage(
                      images[1],
                      selectedElementId === images[1].id,
                      () => onSelectElement(images[1]),
                      "aspect-[3/4] w-36",
                    )}
                  {texts.slice(page.templateKey === "story" ? 0 : 1).map((text) =>
                    spreadText(
                      text,
                      selectedElementId === text.id,
                      () => onSelectElement(text),
                      "block max-w-xs text-sm leading-8 text-muted",
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
