import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publishProject } from "@/lib/api";
import type { Project } from "@/types/project";

const createProject = (): Project => ({
  id: "project-1",
  title: "출판 테스트 북",
  templateId: "구글포토북A",
  bookSpecId: "PHOTOBOOK_A4_SC",
  coverImageUrl: "https://example.com/cover.jpg",
  contentItems: [
    {
      id: "content-1",
      kind: "image",
      title: "이미지 1",
      imageUrl: "https://example.com/photo-1.jpg",
      createdAt: "2026-04-15T00:00:00.000Z",
    },
  ],
  generatedSections: [
    {
      id: "section-cover",
      title: "Cover",
      intro: "Cover intro",
      coverText: "Cover text",
      pages: [
        {
          id: "page-cover",
          sectionId: "section-cover",
          pageNumber: 1,
          kind: "cover",
          templateUid: "template-cover",
          templateName: "Cover Template",
          schema: {
            id: "schema-cover",
            name: "Cover Schema",
            description: "Cover schema",
            templateKind: "cover",
            theme: "theme",
            bookSpecId: "PHOTOBOOK_A4_SC",
            parameterDefinitions: {
              hero: {
                binding: "file",
                type: "string",
                required: true,
              },
            },
            layout: {
              width: 1000,
              height: 1000,
              elements: [],
            },
          },
          parameters: {
            hero: "https://example.com/cover.jpg",
          },
          assignedContentItemIds: [],
        },
      ],
    },
    {
      id: "section-content",
      title: "Content",
      intro: "Content intro",
      coverText: "Content text",
      pages: [
        {
          id: "page-content",
          sectionId: "section-content",
          pageNumber: 2,
          kind: "content",
          templateUid: "template-content",
          templateName: "Content Template",
          schema: {
            id: "schema-content",
            name: "Content Schema",
            description: "Content schema",
            templateKind: "content",
            theme: "theme",
            bookSpecId: "PHOTOBOOK_A4_SC",
            parameterDefinitions: {
              title: {
                binding: "text",
                type: "string",
                required: true,
              },
            },
            layout: {
              width: 1000,
              height: 1000,
              elements: [],
            },
          },
          parameters: {
            title: "본문 페이지",
          },
          assignedContentItemIds: [],
          layoutOverrides: [
            {
              element_id: "override-1",
              type: "text",
              text: "$$title$$",
              position: { x: 0, y: 0 },
              width: 400,
              height: 100,
            },
          ],
        },
      ],
    },
  ],
  status: "generated",
  createdAt: "2026-04-15T00:00:00.000Z",
  updatedAt: "2026-04-15T00:00:00.000Z",
});

describe("publishProject", () => {
  const originalApiKey = process.env.SWEETBOOK_API_KEY;
  const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    process.env.SWEETBOOK_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.SWEETBOOK_API_KEY = originalApiKey;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps content uploads sequential while logging publish timings", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/books")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => ({ data: { bookUid: "book-1" } }),
        });
      }

      if (url.endsWith("/templates")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => ({ data: { templateUid: "template-custom-1" } }),
        });
      }

      if (url.endsWith("/books/book-1/cover")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => ({ data: {} }),
        });
      }

      if (url.includes("/books/book-1/contents?breakBefore=page")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => ({ data: {} }),
        });
      }

      if (url.endsWith("/books/book-1/finalization")) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => ({
            data: {
              pageCount: 2,
              finalizedAt: "2026-04-15T02:00:00.000Z",
            },
          }),
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await publishProject(createProject());

    expect(result.sweetbookBookUid).toBe("book-1");
    expect(result.pageCount).toBe(2);

    const contentCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/books/book-1/contents?breakBefore=page"),
    );

    expect(contentCalls).toHaveLength(2);
    expect(
      (contentCalls[0]?.[1] as RequestInit).body instanceof FormData,
    ).toBe(true);
    expect(
      ((contentCalls[0]?.[1] as RequestInit).body as FormData).get("templateUid"),
    ).toBe("template-cover");
    expect(
      ((contentCalls[1]?.[1] as RequestInit).body as FormData).get("templateUid"),
    ).toBe("template-custom-1");

    const logMessages = consoleLog.mock.calls.map((call) => call.join(" "));
    expect(logMessages.some((message) => message.includes("step books:create"))).toBe(
      true,
    );
    expect(logMessages.some((message) => message.includes("step content:prepare"))).toBe(
      true,
    );
    expect(logMessages.some((message) => message.includes("step content:upload"))).toBe(
      true,
    );
    expect(logMessages.some((message) => message.includes("step finalization"))).toBe(
      true,
    );
  });
});
