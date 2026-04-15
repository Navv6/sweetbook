import { describe, expect, it } from "vitest";

import {
  getAvailableRowGalleryField,
  getAvailableCollageGalleryField,
  getGalleryBindingKeyFromElement,
  getGalleryFieldsFromPage,
  getGalleryFieldsFromSchema,
  getCollageGalleryFields,
  getRowGalleryFields,
  isGalleryTemplatePage,
} from "@/lib/template-gallery";
import type { GeneratedPage, TemplateSchema } from "@/types/project";

const buildSchema = (
  parameterDefinitions: TemplateSchema["parameterDefinitions"],
): TemplateSchema => ({
  id: "schema-1",
  name: "Schema 1",
  description: "Schema",
  templateKind: "content",
  theme: "editorial",
  bookSpecId: "PHOTOBOOK_A5_SC",
  parameterDefinitions,
  layout: {
    width: 100,
    height: 100,
    elements: [],
  },
});

const buildPage = (schema: TemplateSchema): GeneratedPage => ({
  id: "page-1",
  sectionId: "section-1",
  pageNumber: 1,
  kind: "content",
  templateUid: "template-1",
  templateName: "Template 1",
  schema,
  parameters: {},
  assignedContentItemIds: [],
});

describe("template gallery detection", () => {
  it("detects gallery bindings from schema definitions", () => {
    const schema = buildSchema({
      hero: {
        binding: "file",
        type: "string",
        required: false,
      },
      photos: {
        binding: "rowGallery",
        type: "array",
        required: true,
        minItems: 2,
        description: "Main gallery",
      },
      details: {
        binding: "columnGallery",
        type: "array",
        required: false,
      },
      collage: {
        binding: "collageGallery",
        type: "array",
        required: true,
        minItems: 4,
      },
    });

    expect(getGalleryFieldsFromSchema(schema)).toEqual([
      {
        key: "photos",
        binding: "rowGallery",
        required: true,
        minItems: 2,
        label: "Main gallery",
      },
      {
        key: "details",
        binding: "columnGallery",
        required: false,
        minItems: 0,
        label: "details",
      },
      {
        key: "collage",
        binding: "collageGallery",
        required: true,
        minItems: 4,
        label: "collage",
      },
    ]);
  });

  it("classifies pages with gallery definitions as gallery templates", () => {
    const galleryPage = buildPage(
      buildSchema({
        photos: {
          binding: "rowGallery",
          type: "array",
          required: false,
        },
      }),
    );
    const simplePage = buildPage(
      buildSchema({
        hero: {
          binding: "file",
          type: "string",
          required: false,
        },
      }),
    );

    expect(getGalleryFieldsFromPage(galleryPage)).toHaveLength(1);
    expect(isGalleryTemplatePage(galleryPage)).toBe(true);
    expect(isGalleryTemplatePage(simplePage)).toBe(false);
  });

  it("filters row gallery fields and finds an unused binding", () => {
    const page = buildPage(
      buildSchema({
        hero: {
          binding: "file",
          type: "string",
          required: false,
        },
        photos: {
          binding: "rowGallery",
          type: "array",
          required: false,
        },
        moments: {
          binding: "rowGallery",
          type: "array",
          required: false,
        },
      }),
    );

    expect(getRowGalleryFields(page).map((field) => field.key)).toEqual([
      "photos",
      "moments",
    ]);

    expect(
      getAvailableRowGalleryField(page, [
        {
          photos: "$$photos$$",
        },
      ]),
    ).toMatchObject({ key: "moments" });
  });

  it("filters collage gallery fields and finds an unused binding", () => {
    const page = buildPage(
      buildSchema({
        collagePhotos: {
          binding: "collageGallery",
          type: "array",
          required: true,
        },
        alternateCollage: {
          binding: "collageGallery",
          type: "array",
          required: false,
        },
      }),
    );

    expect(getCollageGalleryFields(page).map((field) => field.key)).toEqual([
      "collagePhotos",
      "alternateCollage",
    ]);

    expect(
      getAvailableCollageGalleryField(page, [
        {
          photos: "$$collagePhotos$$",
        },
      ]),
    ).toMatchObject({ key: "alternateCollage" });
  });

  it("extracts a gallery binding key from token or tag values", () => {
    expect(
      getGalleryBindingKeyFromElement({
        photos: "$$photos$$",
      }),
    ).toBe("photos");

    expect(
      getGalleryBindingKeyFromElement({
        tag: "moments",
      }),
    ).toBe("moments");
  });
});
