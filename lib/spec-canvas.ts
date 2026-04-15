/**
 * 판형별 확정된 캔버스 치수 (E2E 검증 완료)
 *
 * cover   : 앞/뒤/책등 스프레드 전체
 * content : 내지 단일 페이지
 * divider : 구분 페이지 (내지와 동일 치수)
 */

export type BookSpecId =
  | "SQUAREBOOK_HC"
  | "PHOTOBOOK_A4_SC"
  | "PHOTOBOOK_A5_SC";

export type PageKind = "cover" | "content" | "divider";

export type CanvasDimension = {
  width: number;
  height: number;
};

export const SPEC_CANVAS: Record<BookSpecId, Record<PageKind, CanvasDimension>> = {
  SQUAREBOOK_HC: {
    cover:   { width: 2073.68, height: 1041.12 },
    content: { width: 978,     height: 1000.8  },
    divider: { width: 978,     height: 1000.8  },
  },
  PHOTOBOOK_A4_SC: {
    cover:   { width: 1742,   height: 1216.52 },
    content: { width: 862.6,  height: 1216.52 },
    divider: { width: 862.6,  height: 1216.52 },
  },
  PHOTOBOOK_A5_SC: {
    cover:   { width: 1245,  height: 867.22 },
    content: { width: 616.5, height: 867.22 },
    divider: { width: 616.5, height: 867.22 },
  },
};

/** 판형별 finalization 최소 페이지 수 */
export const MIN_PAGES: Record<BookSpecId, number> = {
  SQUAREBOOK_HC:   24,
  PHOTOBOOK_A4_SC: 24,
  PHOTOBOOK_A5_SC: 50,
};

export const DEFAULT_MIN_PAGES = 24;

export function getMinimumPageCount(bookSpecId: string): number {
  return MIN_PAGES[bookSpecId as BookSpecId] ?? DEFAULT_MIN_PAGES;
}

export function isBelowMinimumPageCount(
  pageCount: number,
  bookSpecId: string,
): boolean {
  return pageCount < getMinimumPageCount(bookSpecId);
}

export function getCanvasDimension(
  bookSpecId: string,
  kind: string,
): CanvasDimension | null {
  const specCanvas = SPEC_CANVAS[bookSpecId as BookSpecId];
  if (!specCanvas) return null;
  return specCanvas[kind as PageKind] ?? null;
}
