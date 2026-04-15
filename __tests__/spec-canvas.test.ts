import { describe, expect, it } from "vitest";

import {
  DEFAULT_MIN_PAGES,
  getMinimumPageCount,
  isBelowMinimumPageCount,
} from "@/lib/spec-canvas";

describe("spec canvas minimum page rules", () => {
  it("uses 50 pages as the minimum for PHOTOBOOK_A5_SC", () => {
    expect(getMinimumPageCount("PHOTOBOOK_A5_SC")).toBe(50);
    expect(isBelowMinimumPageCount(49, "PHOTOBOOK_A5_SC")).toBe(true);
    expect(isBelowMinimumPageCount(50, "PHOTOBOOK_A5_SC")).toBe(false);
  });

  it("uses 24 pages as the minimum for A4 and square specs", () => {
    expect(getMinimumPageCount("PHOTOBOOK_A4_SC")).toBe(24);
    expect(getMinimumPageCount("SQUAREBOOK_HC")).toBe(24);
    expect(isBelowMinimumPageCount(23, "PHOTOBOOK_A4_SC")).toBe(true);
    expect(isBelowMinimumPageCount(24, "PHOTOBOOK_A4_SC")).toBe(false);
    expect(isBelowMinimumPageCount(23, "SQUAREBOOK_HC")).toBe(true);
    expect(isBelowMinimumPageCount(24, "SQUAREBOOK_HC")).toBe(false);
  });

  it("falls back to the default minimum for unknown specs", () => {
    expect(getMinimumPageCount("UNKNOWN_SPEC")).toBe(DEFAULT_MIN_PAGES);
    expect(isBelowMinimumPageCount(23, "UNKNOWN_SPEC")).toBe(true);
    expect(isBelowMinimumPageCount(24, "UNKNOWN_SPEC")).toBe(false);
  });
});
