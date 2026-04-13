"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TemplatePageRenderer } from "@/components/preview/TemplatePageRenderer";
import { SoundtrackQR } from "@/components/ui/SoundtrackQR";
import type { GeneratedPage, Project } from "@/types/project";

const getPageAspectRatio = (page: GeneratedPage | null) => {
  const width = page?.schema?.layout?.width;
  const height = page?.schema?.layout?.height;

  if (
    typeof width === "number" &&
    width > 0 &&
    typeof height === "number" &&
    height > 0
  ) {
    return width / height;
  }

  return 1 / 1.4;
};

const isSpreadPage = (page: GeneratedPage | null) => getPageAspectRatio(page) > 1.05;

const EmptyPage = ({ aspectRatio }: { aspectRatio: number }) => (
  <div
    className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/90"
    style={{ aspectRatio: `${aspectRatio}` }}
  />
);

type SpreadEntry = {
  pages: [GeneratedPage | null, GeneratedPage | null];
  isWide: boolean;
};

export function BookPreviewModal({
  project,
  isOpen,
  onClose,
}: {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentSpread, setCurrentSpread] = useState(0);
  const pages = useMemo(
    () => project.generatedSections.flatMap((section) => section.pages),
    [project.generatedSections],
  );
  const canonicalSpreadRatio = useMemo(() => {
    const firstValid =
      pages.find((p) => p?.schema?.layout?.width && p?.schema?.layout?.height) ??
      pages[0] ??
      null;
    const ratio = getPageAspectRatio(firstValid);
    return isSpreadPage(firstValid) ? ratio : ratio * 2;
  }, [pages]);

  const spreads = useMemo(() => {
    const next: SpreadEntry[] = [];

    for (let index = 0; index < pages.length; ) {
      const current = pages[index] ?? null;
      const upcoming = pages[index + 1] ?? null;

      if (isSpreadPage(current)) {
        next.push({
          pages: [current, null],
          isWide: true,
        });
        index += 1;
        continue;
      }

      if (isSpreadPage(upcoming)) {
        next.push({
          pages: [current, null],
          isWide: false,
        });
        index += 1;
        continue;
      }

      next.push({
        pages: [current, upcoming],
        isWide: false,
      });
      index += 2;
    }

    return next;
  }, [pages]);

  const handleClose = useCallback(() => {
    setCurrentSpread(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
      if (event.key === "ArrowRight") {
        setCurrentSpread((current) => Math.min(current + 1, spreads.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setCurrentSpread((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, spreads.length]);

  if (!isOpen) {
    return null;
  }

  const spread = spreads[currentSpread] ?? {
    pages: [null, null] as [GeneratedPage | null, GeneratedPage | null],
    isWide: false,
  };
  const [leftPage, rightPage] = spread.pages;
  const pageAspectRatio = getPageAspectRatio(leftPage ?? rightPage);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === overlayRef.current) {
          handleClose();
        }
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-4 py-6 md:px-8">
        <div className="relative grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-xl text-white transition hover:bg-white/20"
            aria-label="Close preview"
          >
            ×
          </button>

          <section className="min-w-0">
            <div className="mb-6 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Book Preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {project.title}
              </h2>
              <p className="mt-3 text-sm text-white/60">
                {`${project.templateId} · ${project.bookSpecId}`}
              </p>
            </div>

            <div
              className="mx-auto"
              style={{
                width: `min(1100px, calc(100vw - 2rem), calc((100vh - 210px) * ${canonicalSpreadRatio}))`,
              }}
            >
              <div className="mx-auto w-full" style={{ aspectRatio: `${canonicalSpreadRatio}` }}>
                <div
                  className={`grid h-full gap-4 rounded-[2.25rem] bg-white/6 p-3 md:gap-5 md:p-4 ${
                    spread.isWide ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  <div className="flex h-full items-center justify-center rounded-[2rem] bg-white/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-4">
                    <div className="w-full">
                      {leftPage ? (
                        <TemplatePageRenderer page={leftPage} />
                      ) : (
                        <EmptyPage aspectRatio={pageAspectRatio} />
                      )}
                    </div>
                  </div>

                  {!spread.isWide && (
                    <div className="flex h-full items-center justify-center rounded-[2rem] bg-white/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-4">
                      <div className="w-full">
                        {rightPage ? (
                          <TemplatePageRenderer page={rightPage} />
                        ) : (
                          <EmptyPage aspectRatio={pageAspectRatio} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="self-center rounded-[2rem] bg-white/10 p-6 text-white">
            <p className="section-label text-white/60">Spread</p>
            <p className="mt-3 text-3xl font-semibold">
              {`${currentSpread + 1}/${Math.max(spreads.length, 1)}`}
            </p>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>{project.bookSpecId}</p>
              <p>{`${pages.length} pages`}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setCurrentSpread((current) => Math.max(current - 1, 0))
                }
                className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentSpread((current) =>
                    Math.min(current + 1, spreads.length - 1),
                  )
                }
                className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
              >
                Next
              </button>
            </div>

            <div className="mt-8">
              <SoundtrackQR
                projectId={project.id}
                projectTitle={project.title}
                size={140}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
