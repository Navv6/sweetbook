"use client";

import { useEffect, useRef, useState } from "react";

import { SoundtrackQR } from "@/components/ui/SoundtrackQR";
import type { GeneratedPage, PageElement, Project } from "@/types/project";

// ─── 페이지 렌더러 ───────────────────────────────────────────────────────────

function PreviewImage({
  element,
}: {
  element: Extract<PageElement, { type: "image" }>;
}) {
  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(${element.imageUrl})`,
        transform: `scale(${element.crop.scale}) translate(${(0.5 - element.crop.x) * 35}%, ${(0.5 - element.crop.y) * 35}%)`,
      }}
    />
  );
}

function PreviewPageContent({
  page,
  side,
}: {
  page: GeneratedPage | null;
  side: "left" | "right";
}) {
  if (!page) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-gray-300 select-none">
        {"빈 페이지"}
      </div>
    );
  }

  const images = page.elements.filter(
    (el): el is Extract<PageElement, { type: "image" }> => el.type === "image",
  );
  const texts = page.elements.filter(
    (el): el is Extract<PageElement, { type: "text" }> => el.type === "text",
  );
  const leadText = texts[0];
  const bodyText = texts[1];

  const isCover = page.templateKey === "cover";
  const isGallery = page.templateKey === "gallery";

  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${isCover ? "" : "p-6"}`}>
      {/* Cover */}
      {isCover && (
        <>
          {images[0] && <PreviewImage element={images[0]} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {leadText && (
              <p className="text-xl font-semibold leading-tight">
                {leadText.value}
              </p>
            )}
            {bodyText && (
              <p className="mt-1 text-xs opacity-75">{bodyText.value}</p>
            )}
          </div>
        </>
      )}

      {/* Intro */}
      {page.templateKey === "intro" && (
        <>
          <div className="flex-1 flex flex-col justify-center">
            {leadText && (
              <p className="text-lg font-semibold leading-snug text-gray-900">
                {leadText.value}
              </p>
            )}
            {bodyText && (
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {bodyText.value}
              </p>
            )}
          </div>
          <div className="mt-4 h-px w-10 bg-gray-300" />
        </>
      )}

      {/* Gallery */}
      {isGallery && (
        <>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {images.slice(0, 4).map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-sm">
                <PreviewImage element={img} />
                <div className="aspect-square" />
              </div>
            ))}
          </div>
          {leadText && (
            <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
              {leadText.value}
            </p>
          )}
        </>
      )}

      {/* Focus / Story */}
      {(page.templateKey === "focus" || page.templateKey === "story") && (
        <>
          {images[0] && (
            <div className="relative overflow-hidden rounded-sm" style={{ height: "60%" }}>
              <PreviewImage element={images[0]} />
            </div>
          )}
          <div className="mt-4 flex-1">
            {leadText && (
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {leadText.value}
              </p>
            )}
            {bodyText && (
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                {bodyText.value}
              </p>
            )}
          </div>
          {images[1] && (
            <div
              className="mt-2 relative overflow-hidden rounded-sm"
              style={{ height: "18%" }}
            >
              <PreviewImage element={images[1]} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 스프레드 뷰어 ─────────────────────────────────────────────────────────

function SpreadViewer({
  spreads,
  currentSpread,
  onPrev,
  onNext,
  total,
}: {
  spreads: Array<[GeneratedPage | null, GeneratedPage | null]>;
  currentSpread: number;
  onPrev: () => void;
  onNext: () => void;
  total: number;
}) {
  const [flipping, setFlipping] = useState<"forward" | "backward" | null>(null);
  const [displaySpread, setDisplaySpread] = useState(currentSpread);

  const handleNext = () => {
    if (currentSpread >= total - 1 || flipping) return;
    setFlipping("forward");
    setTimeout(() => {
      setDisplaySpread(currentSpread + 1);
      setFlipping(null);
      onNext();
    }, 350);
  };

  const handlePrev = () => {
    if (currentSpread <= 0 || flipping) return;
    setFlipping("backward");
    setTimeout(() => {
      setDisplaySpread(currentSpread - 1);
      setFlipping(null);
      onPrev();
    }, 350);
  };

  const spread = spreads[displaySpread] ?? [null, null];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 책 스프레드 */}
      <div className="relative flex" style={{ perspective: "1200px" }}>
        {/* 왼쪽 페이지 */}
        <div
          className="relative overflow-hidden bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.06)]"
          style={{
            width: "min(340px, 42vw)",
            height: "min(480px, 60vw)",
            transformOrigin: "right center",
            transform:
              flipping === "forward"
                ? "rotateY(-8deg)"
                : flipping === "backward"
                  ? "rotateY(8deg)"
                  : "rotateY(0deg)",
            transition: "transform 0.35s ease",
            borderRadius: "2px 0 0 2px",
          }}
        >
          {/* 페이지 라인 */}
          <div className="absolute inset-y-0 right-0 w-px bg-gray-100" />
          <PreviewPageContent page={spread[0]} side="left" />
        </div>

        {/* 책 중앙 바인딩 */}
        <div
          className="relative z-10 flex-shrink-0"
          style={{ width: "14px" }}
        >
          <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-gray-300/50" />
        </div>

        {/* 오른쪽 페이지 */}
        <div
          className="relative overflow-hidden bg-white shadow-[4px_0_20px_rgba(0,0,0,0.06)]"
          style={{
            width: "min(340px, 42vw)",
            height: "min(480px, 60vw)",
            transformOrigin: "left center",
            transform:
              flipping === "forward"
                ? "rotateY(8deg)"
                : flipping === "backward"
                  ? "rotateY(-8deg)"
                  : "rotateY(0deg)",
            transition: "transform 0.35s ease",
            borderRadius: "0 2px 2px 0",
          }}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-gray-100" />
          <PreviewPageContent page={spread[1]} side="right" />
        </div>

        {/* 좌우 넘기기 버튼 */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentSpread <= 0}
          className="absolute left-0 top-1/2 -translate-x-12 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg disabled:opacity-30"
          aria-label="이전 페이지"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentSpread >= total - 1}
          className="absolute right-0 top-1/2 translate-x-12 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg disabled:opacity-30"
          aria-label="다음 페이지"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 페이지 카운터 */}
      <div className="flex items-center gap-3">
        {spreads.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === displaySpread ? "w-6 bg-gray-700" : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-widest">
        {`Spread ${displaySpread + 1} / ${total}`}
      </p>
    </div>
  );
}

// ─── 3D 북 커버 ──────────────────────────────────────────────────────────────

function Book3D({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  const coverImage =
    project.coverImageUrl ??
    project.contentItems[0]?.imageUrl ??
    "https://api-sandbox.sweetbook.com/templates_thumb/31LOxBQzsVwo/layout.jpg";

  const pageCount = project.generatedSections.reduce(
    (acc, s) => acc + s.pages.length,
    0,
  );
  const thickness = Math.max(16, Math.min(pageCount * 1.2, 36));

  return (
    <div className="flex flex-col items-center gap-10">
      {/* 3D 북 */}
      <div style={{ perspective: "1000px" }} className="cursor-pointer group" onClick={onOpen}>
        <div
          className="relative transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateY(-6deg) rotateX(3deg)",
            width: "220px",
            height: "300px",
          }}
        >
          {/* 앞면 (표지) */}
          <div
            className="absolute inset-0 overflow-hidden rounded-r-sm shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: `translateZ(${thickness / 2}px)`,
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white text-sm font-semibold leading-tight drop-shadow">
                {project.title}
              </p>
              <p className="mt-1 text-white/60 text-[10px] uppercase tracking-widest">
                {"SweetBook Studio"}
              </p>
            </div>
          </div>

          {/* 책등 (스파인) */}
          <div
            className="absolute top-0 bottom-0 overflow-hidden"
            style={{
              width: `${thickness}px`,
              left: 0,
              transform: `rotateY(-90deg) translateZ(${thickness / 2}px)`,
              backfaceVisibility: "hidden",
              background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          >
            <p
              className="text-white/80 text-[8px] uppercase tracking-[0.3em] whitespace-nowrap"
              style={{
                writingMode: "vertical-lr",
                transform: "rotate(180deg)",
                position: "absolute",
                top: "50%",
                left: "50%",
                translate: "-50% -50%",
              }}
            >
              {project.title}
            </p>
          </div>

          {/* 뒷면 */}
          <div
            className="absolute inset-0 rounded-l-sm"
            style={{
              transform: `rotateY(180deg) translateZ(${thickness / 2}px)`,
              backfaceVisibility: "hidden",
              background: "#f0ebe4",
            }}
          />

          {/* 페이지 단면 (오른쪽) */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              width: `${thickness}px`,
              right: 0,
              transform: `rotateY(90deg) translateZ(${220 - thickness / 2}px)`,
              backfaceVisibility: "hidden",
              background:
                "repeating-linear-gradient(to bottom, #f5f0eb 0px, #f5f0eb 1px, #ece7e0 1px, #ece7e0 2px)",
            }}
          />

          {/* 상단 단면 */}
          <div
            className="absolute left-0 right-0"
            style={{
              height: `${thickness}px`,
              top: 0,
              transform: `rotateX(90deg) translateZ(${thickness / 2}px)`,
              backfaceVisibility: "hidden",
              background: "linear-gradient(to right, #e8e3dc, #f5f0eb)",
            }}
          />
        </div>
      </div>

      {/* 열기 버튼 */}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h5a1 1 0 0 1 1 1v8H2V4ZM14 4H9a1 1 0 0 0-1 1v8h6V4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        {"책 펼쳐보기"}
      </button>

      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
        {`${pageCount}페이지 · ${project.bookSpecId}`}
      </p>

      <SoundtrackQR
        projectId={project.id}
        projectTitle={project.title}
        size={120}
      />
    </div>
  );
}

// ─── 메인 모달 ─────────────────────────────────────────────────────────────

export function BookPreviewModal({
  project,
  isOpen,
  onClose,
}: {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"cover" | "reading">("cover");
  const [currentSpread, setCurrentSpread] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 열릴 때마다 cover 모드로 초기화
  useEffect(() => {
    if (isOpen) {
      setMode("cover");
      setCurrentSpread(0);
    }
  }, [isOpen]);

  // 키보드 ESC 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentSpread((prev) => Math.min(prev + 1, spreads.length - 1));
      if (e.key === "ArrowLeft") setCurrentSpread((prev) => Math.max(prev - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // 모든 페이지를 flat 배열로
  const allPages = project.generatedSections.flatMap((section) => section.pages);

  // 2페이지씩 스프레드로 구성 (첫 스프레드는 [null, 표지])
  const spreads: Array<[GeneratedPage | null, GeneratedPage | null]> = [];
  spreads.push([null, allPages[0] ?? null]);
  for (let i = 1; i < allPages.length; i += 2) {
    spreads.push([allPages[i] ?? null, allPages[i + 1] ?? null]);
  }
  if (allPages.length > 1 && allPages.length % 2 === 0) {
    spreads.push([allPages[allPages.length - 1] ?? null, null]);
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative flex max-h-screen w-full max-w-5xl flex-col items-center overflow-y-auto px-4 py-10">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            {"Book Preview"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {project.title}
          </h2>
        </div>

        {mode === "cover" ? (
          <Book3D
            project={project}
            onOpen={() => setMode("reading")}
          />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <SpreadViewer
              spreads={spreads}
              currentSpread={currentSpread}
              onPrev={() => setCurrentSpread((prev) => Math.max(prev - 1, 0))}
              onNext={() =>
                setCurrentSpread((prev) => Math.min(prev + 1, spreads.length - 1))
              }
              total={spreads.length}
            />
            <button
              type="button"
              onClick={() => setMode("cover")}
              className="text-xs uppercase tracking-widest text-white/40 transition hover:text-white/70"
            >
              {"← 책 덮기"}
            </button>
            <p className="text-[11px] text-white/30">
              {"← → 키로도 페이지를 넘길 수 있습니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
