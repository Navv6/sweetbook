"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TemplatePageRenderer } from "@/components/preview/TemplatePageRenderer";
import type { GeneratedPage, TemplateLayoutElement } from "@/types/project";

/* ── resize handle directions ──────────────────────────────────── */

type HandleDir = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
const HANDLE_DIRS: HandleDir[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const HANDLE_CURSOR: Record<HandleDir, string> = {
  n: "n-resize", ne: "ne-resize", e: "e-resize", se: "se-resize",
  s: "s-resize", sw: "sw-resize", w: "w-resize", nw: "nw-resize",
};

/** handle center as [left%, top%] of the element bounding box */
const HANDLE_POS: Record<HandleDir, [string, string]> = {
  n:  ["50%", "0%"],  ne: ["100%", "0%"],
  e:  ["100%", "50%"], se: ["100%", "100%"],
  s:  ["50%", "100%"], sw: ["0%", "100%"],
  w:  ["0%", "50%"],  nw: ["0%", "0%"],
};

const hasDir = (action: HandleDir, dir: "n" | "s" | "e" | "w") =>
  ({ n: ["n","ne","nw"], s: ["s","se","sw"], e: ["e","ne","se"], w: ["w","nw","sw"] }[dir].includes(action));

/* ── drag state ─────────────────────────────────────────────────── */

type DragState = {
  elementId: string;
  action: "move" | HandleDir;
  startMouseX: number;
  startMouseY: number;
  startElemX: number;
  startElemY: number;
  startElemW: number;
  startElemH: number;
};

const TOKEN_PATTERN = /\$\$([A-Za-z0-9_]+)\$\$/g;

/* ── utils ───────────────────────────────────────────────────────── */

const toPercent = (v: number, total: number) => `${(v / total) * 100}%`;

const pxToCanvas = (
  dx: number, dy: number,
  rect: DOMRect, canvasW: number, canvasH: number,
) => ({
  cx: (dx / rect.width) * canvasW,
  cy: (dy / rect.height) * canvasH,
});

const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json().catch(() => null)) as
    | { url?: string; message?: string }
    | null;
  if (!response.ok || !data?.url) {
    throw new Error(data?.message ?? "이미지 업로드에 실패했습니다.");
  }
  return data.url;
};

const findTokenKeys = (value?: string) => {
  if (typeof value !== "string") return [];
  return Array.from(value.matchAll(TOKEN_PATTERN)).map((match) => match[1]);
};

const getElementBindingKey = (element: TemplateLayoutElement) =>
  [
    ...findTokenKeys(element.text),
    ...findTokenKeys(element.imageSource),
    ...findTokenKeys(element.fileName),
    ...findTokenKeys(element.photos),
    typeof element.tag === "string" ? element.tag : null,
  ].find((key): key is string => Boolean(key)) ?? null;

const getElementLabel = (element: TemplateLayoutElement) => {
  const bindingKey = getElementBindingKey(element);
  return bindingKey
    ? `${element.type} · ${bindingKey}`
    : `${element.type} · custom`;
};

/* ── component ───────────────────────────────────────────────────── */

export function FreeLayoutEditor({
  page,
  onLayoutChange,
}: {
  page: GeneratedPage;
  onLayoutChange: (elements: TemplateLayoutElement[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [elements, setElements] = useState<TemplateLayoutElement[]>(
    () => page.layoutOverrides ?? [...page.schema.layout.elements],
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // reset when page changes
  useEffect(() => {
    setElements(page.layoutOverrides ?? [...page.schema.layout.elements]);
    setSelectedId(null);
    setEditingId(null);
  }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasW = page.schema.layout.width;
  const canvasH = page.schema.layout.height;

  /* commit current elements to parent */
  const commit = useCallback(
    (next: TemplateLayoutElement[]) => onLayoutChange(next),
    [onLayoutChange],
  );

  const applyElements = (next: TemplateLayoutElement[]) => {
    setElements(next);
    commit(next);
  };

  /* ── drag / resize ───────────────────────────────────────────── */

  const startDrag = useCallback(
    (elementId: string, action: DragState["action"], e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (editingId) return;
      const elem = elementsRef.current.find((el) => el.element_id === elementId);
      if (!elem) return;
      setSelectedId(elementId);
      setDragState({
        elementId, action,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startElemX: elem.position.x,
        startElemY: elem.position.y,
        startElemW: elem.width ?? canvasW * 0.2,
        startElemH: elem.height ?? canvasH * 0.1,
      });
    },
    [canvasW, canvasH, editingId],
  );

  useEffect(() => {
    if (!dragState) return;
    const MIN = 20;

    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { cx, cy } = pxToCanvas(
        e.clientX - dragState.startMouseX,
        e.clientY - dragState.startMouseY,
        rect, canvasW, canvasH,
      );

      setElements((prev) =>
        prev.map((el) => {
          if (el.element_id !== dragState.elementId) return el;
          if (dragState.action === "move") {
            return { ...el, position: { x: dragState.startElemX + cx, y: dragState.startElemY + cy } };
          }
          const a = dragState.action as HandleDir;
          let newX = dragState.startElemX, newY = dragState.startElemY;
          let newW = dragState.startElemW, newH = dragState.startElemH;
          if (hasDir(a, "e")) newW = Math.max(MIN, dragState.startElemW + cx);
          if (hasDir(a, "s")) newH = Math.max(MIN, dragState.startElemH + cy);
          if (hasDir(a, "w")) { const w = Math.max(MIN, dragState.startElemW - cx); newX = dragState.startElemX + dragState.startElemW - w; newW = w; }
          if (hasDir(a, "n")) { const h = Math.max(MIN, dragState.startElemH - cy); newY = dragState.startElemY + dragState.startElemH - h; newH = h; }
          return { ...el, position: { x: newX, y: newY }, width: newW, height: newH };
        }),
      );
    };

    const onUp = () => {
      setDragState(null);
      commit(elementsRef.current);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragState, canvasW, canvasH, commit]);

  /* ── add / delete elements ───────────────────────────────────── */

  const addTextElement = () => {
    const id = `custom_text_${crypto.randomUUID().slice(0, 8)}`;
    const newEl: TemplateLayoutElement = {
      element_id: id,
      type: "text",
      text: "새 텍스트",
      position: { x: canvasW * 0.1, y: canvasH * 0.1 },
      width: canvasW * 0.4,
      height: canvasH * 0.08,
      fontSize: Math.round(canvasH * 0.04),
      textBrush: "#222222",
      fontFamily: "Noto Sans KR",
      textAlignment: "center",
      verticalAlignment: "center",
    };
    const next = [...elementsRef.current, newEl];
    applyElements(next);
    setSelectedId(id);
  };

  const createPhotoElement = (imageSource: string) => {
    const id = `custom_photo_${crypto.randomUUID().slice(0, 8)}`;
    const newEl: TemplateLayoutElement = {
      element_id: id,
      type: "photo",
      imageSource,
      fit: "cover",
      position: { x: canvasW * 0.15, y: canvasH * 0.15 },
      width: canvasW * 0.35,
      height: canvasH * 0.4,
    };
    const next = [...elementsRef.current, newEl];
    applyElements(next);
    setSelectedId(id);
  };

  const handlePhotoFile = async (file: File) => {
    try {
      const url = await uploadImageFile(file);
      createPhotoElement(url);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = elementsRef.current.filter((el) => el.element_id !== selectedId);
    applyElements(next);
    setSelectedId(null);
  };

  /* ── inline text editing ─────────────────────────────────────── */

  const commitTextEdit = (id: string, value: string) => {
    const next = elementsRef.current.map((el) =>
      el.element_id === id ? { ...el, text: value } : el,
    );
    applyElements(next);
    setEditingId(null);
  };

  /* ── selected element metadata ───────────────────────────────── */

  const selectedEl = elements.find((el) => el.element_id === selectedId) ?? null;
  const isTextSelected = selectedEl?.type === "text" || (selectedEl?.text && !selectedEl.imageSource && !selectedEl.fileName);

  const updateSelectedProp = (patch: Partial<TemplateLayoutElement>) => {
    if (!selectedId) return;
    const next = elementsRef.current.map((el) =>
      el.element_id === selectedId ? { ...el, ...patch } : el,
    );
    applyElements(next);
  };

  /* ── render ──────────────────────────────────────────────────── */

  const displayPage: GeneratedPage = {
    ...page,
    layoutOverrides: undefined,
    schema: { ...page.schema, layout: { ...page.schema.layout, elements } },
  };

  return (
    <div className="space-y-3">
      {/* ── canvas ── */}
      <div
        ref={containerRef}
        className="relative"
        style={{ aspectRatio: `${canvasW} / ${canvasH}` }}
      >
        {/* renderer — clipped */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] border-2 border-primary/50">
          <TemplatePageRenderer page={displayPage} />
        </div>

        {/* overlay — NOT overflow:hidden so handles are never clipped */}
        <div
          className="absolute inset-0"
          style={{ overflow: "visible", pointerEvents: "none" }}
          onMouseDown={() => { setSelectedId(null); setEditingId(null); }}
        >
          {elements.map((el) => {
            const isSelected = el.element_id === selectedId;
            const isEditing = el.element_id === editingId;
            const w = el.width ?? canvasW * 0.2;
            const h = el.height ?? canvasH * 0.1;

            return (
              <div
                key={el.element_id}
                style={{
                  position: "absolute",
                  left: toPercent(el.position.x, canvasW),
                  top: toPercent(el.position.y, canvasH),
                  width: toPercent(w, canvasW),
                  height: toPercent(h, canvasH),
                  pointerEvents: "auto",
                  cursor: dragState?.elementId === el.element_id && dragState.action === "move" ? "grabbing" : "grab",
                  boxSizing: "border-box",
                  border: isSelected
                    ? "2px solid rgba(37,99,235,0.9)"
                    : "1px dashed rgba(100,100,100,0.25)",
                  background: isSelected ? "rgba(37,99,235,0.04)" : "transparent",
                  userSelect: "none",
                }}
                onMouseDown={(e) => startDrag(el.element_id, "move", e)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (isTextSelected || el.type === "text") setEditingId(el.element_id);
                }}
              >
                <div
                  className="absolute left-0 top-0 -translate-y-[calc(100%+6px)] rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow"
                  style={{
                    pointerEvents: "none",
                    maxWidth: "calc(100% + 24px)",
                  }}
                >
                  <span className="block truncate">{getElementLabel(el)}</span>
                </div>

                {/* inline text editor */}
                {isEditing && (
                  <textarea
                    autoFocus
                    defaultValue={el.text ?? ""}
                    className="absolute inset-0 h-full w-full resize-none border-none bg-white/90 p-1 text-center text-sm text-black outline-none"
                    style={{ fontSize: el.fontSize ? `${el.fontSize * 0.6}px` : undefined }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onBlur={(e) => commitTextEdit(el.element_id, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        commitTextEdit(el.element_id, e.currentTarget.value);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                )}

                {/* resize handles */}
                {isSelected && !isEditing &&
                  HANDLE_DIRS.map((dir) => {
                    const [left, top] = HANDLE_POS[dir];
                    return (
                      <div
                        key={dir}
                        style={{
                          position: "absolute",
                          left, top,
                          transform: "translate(-50%, -50%)",
                          width: 14, height: 14,
                          borderRadius: 3,
                          background: "white",
                          border: "2px solid rgba(37,99,235,0.9)",
                          cursor: HANDLE_CURSOR[dir],
                          zIndex: 10,
                          pointerEvents: "auto",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                        }}
                        onMouseDown={(e) => startDrag(el.element_id, dir, e)}
                      />
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* edit badge */}
        <div
          className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow"
          style={{ pointerEvents: "none" }}
        >
          자유 편집
        </div>
      </div>

      {/* ── properties strip (text selected) ── */}
      {isTextSelected && selectedEl && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-xs">
          <span className="font-semibold text-secondary">텍스트</span>
          <input
            type="text"
            className="min-w-0 flex-1 rounded-lg border border-outline/30 bg-white px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
            placeholder="텍스트 내용"
            value={selectedEl.text ?? ""}
            onChange={(e) => updateSelectedProp({ text: e.target.value })}
          />
          <label className="flex items-center gap-1 text-secondary">
            크기
            <input
              type="number"
              min={8}
              max={300}
              className="w-16 rounded-lg border border-outline/30 bg-white px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
              value={selectedEl.fontSize ?? 40}
              onChange={(e) =>
                updateSelectedProp({ fontSize: Number(e.target.value) })
              }
            />
          </label>
          <label className="flex items-center gap-1 text-secondary">
            색상
            <input
              type="color"
              className="h-7 w-7 cursor-pointer rounded border border-outline/30"
              value={selectedEl.textBrush ?? "#222222"}
              onChange={(e) => updateSelectedProp({ textBrush: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-1 text-secondary">
            굵게
            <input
              type="checkbox"
              checked={selectedEl.textBold ?? false}
              onChange={(e) => updateSelectedProp({ textBold: e.target.checked })}
            />
          </label>
        </div>
      )}

      {/* ── toolbar ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addTextElement}
          className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-secondary transition hover:bg-surface-container hover:text-foreground"
        >
          + 텍스트
        </button>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-secondary transition hover:bg-surface-container hover:text-foreground"
        >
          + 사진 파일
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePhotoFile(file);
            e.target.value = "";
          }}
        />
        {selectedId && (
          <button
            type="button"
            onClick={deleteSelected}
            className="ml-auto rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
