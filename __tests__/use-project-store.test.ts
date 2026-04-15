import { describe, expect, it } from "vitest";

import { sanitizeProjectForPersist } from "@/store/useProjectStore";
import type { Project } from "@/types/project";

const buildProject = (): Project => ({
  id: "project-1",
  title: "SweetBook",
  templateId: "template-family",
  bookSpecId: "PHOTOBOOK_A5_SC",
  coverImageUrl: "data:image/png;base64,cover",
  contentItems: [
    {
      id: "content-1",
      kind: "image",
      title: "Cover",
      imageUrl: "data:image/png;base64,content",
      createdAt: "2026-04-15T00:00:00.000Z",
    },
  ],
  generatedSections: [
    {
      id: "section-1",
      title: "Section 1",
      intro: "Intro",
      coverText: "Cover",
      pages: [
        {
          id: "page-1",
          sectionId: "section-1",
          pageNumber: 1,
          kind: "content",
          templateUid: "template-1",
          templateName: "Template 1",
          schema: {
            id: "schema-1",
            name: "Schema 1",
            description: "Schema",
            templateKind: "content",
            theme: "editorial",
            bookSpecId: "PHOTOBOOK_A5_SC",
            parameterDefinitions: {
              heroImage: {
                binding: "file",
                type: "string",
                required: false,
              },
              gallery: {
                binding: "rowGallery",
                type: "array",
                required: false,
              },
            },
            layout: {
              width: 100,
              height: 100,
              elements: [],
            },
          },
          parameters: {
            heroImage: "data:image/png;base64,hero",
            gallery: [
              "https://example.com/kept.jpg",
              "data:image/png;base64,drop-me",
            ],
          },
          assignedContentItemIds: [],
          layoutOverrides: [
            {
              element_id: "photo-1",
              type: "photo",
              imageSource: "data:image/png;base64,override",
              position: { x: 10, y: 20 },
              width: 40,
              height: 30,
            },
            {
              element_id: "photo-2",
              type: "photo",
              imageSource: "https://example.com/keep.jpg",
              position: { x: 30, y: 40 },
              width: 20,
              height: 10,
            },
            {
              element_id: "photo-3",
              type: "photo",
              imageSource: "$$heroImage$$",
              position: { x: 50, y: 60 },
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

describe("sanitizeProjectForPersist", () => {
  it("removes data URLs from persisted media fields while preserving safe values", () => {
    const sanitized = sanitizeProjectForPersist(buildProject());
    const page = sanitized.generatedSections[0]?.pages[0];

    expect(sanitized.coverImageUrl).toBeUndefined();
    expect(sanitized.contentItems[0]?.imageUrl).toBeUndefined();
    expect(page?.parameters.heroImage).toBe("");
    expect(page?.parameters.gallery).toEqual(["https://example.com/kept.jpg"]);

    expect(page?.layoutOverrides?.[0]?.imageSource).toBeUndefined();
    expect(page?.layoutOverrides?.[1]?.imageSource).toBe(
      "https://example.com/keep.jpg",
    );
    expect(page?.layoutOverrides?.[2]?.imageSource).toBe("$$heroImage$$");
    expect(page?.layoutOverrides?.[0]?.position).toEqual({ x: 10, y: 20 });
    expect(page?.layoutOverrides?.[0]?.width).toBe(40);
    expect(page?.layoutOverrides?.[0]?.height).toBe(30);
  });
});
