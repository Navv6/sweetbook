import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FreeLayoutEditor } from "@/components/editor/FreeLayoutEditor";
import type { GeneratedPage } from "@/types/project";

vi.mock("@/components/preview/TemplatePageRenderer", () => ({
  TemplatePageRenderer: () => <div data-testid="template-renderer" />,
}));

const buildPage = (): GeneratedPage => ({
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
      gallery: {
        binding: "rowGallery",
        type: "array",
        required: false,
      },
    },
    layout: {
      width: 1000,
      height: 1400,
      elements: [],
    },
  },
  parameters: {
    gallery: [],
  },
  assignedContentItemIds: [],
});

const buildCollagePage = (): GeneratedPage => ({
  ...buildPage(),
  schema: {
    ...buildPage().schema,
    parameterDefinitions: {
      collagePhotos: {
        binding: "collageGallery",
        type: "array",
        required: true,
      },
    },
  },
  parameters: {
    collagePhotos: [],
  },
});

describe("FreeLayoutEditor row gallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("adds a row gallery element bound to the next available gallery field", () => {
    const onLayoutChange = vi.fn();

    render(
      <FreeLayoutEditor page={buildPage()} onLayoutChange={onLayoutChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Row Gallery/i }));

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        type: "rowGallery",
        tag: "gallery",
        photos: "$$gallery$$",
        fit: "cover",
      }),
    ]);
  });

  it("disables the add button when every row gallery field is already used", () => {
    const page = buildPage();
    page.layoutOverrides = [
      {
        element_id: "gallery-1",
        type: "rowGallery",
        photos: "$$gallery$$",
        tag: "gallery",
        fit: "cover",
        position: { x: 0, y: 0 },
        width: 400,
        height: 200,
      },
    ];

    const view = render(<FreeLayoutEditor page={page} onLayoutChange={vi.fn()} />);

    expect(
      view
        .getByRole("button", { name: /\+ Row Gallery/i })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      view.getByText("No unused rowGallery field is available on this page."),
    ).toBeTruthy();
  });

  it("adds a collage gallery element bound to the next available collage field", () => {
    const onLayoutChange = vi.fn();

    render(
      <FreeLayoutEditor
        page={buildCollagePage()}
        onLayoutChange={onLayoutChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /\+ Collage Gallery/i }),
    );

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        type: "collageGallery",
        tag: "collagePhotos",
        photos: "$$collagePhotos$$",
        fit: "cover",
      }),
    ]);
  });

  it("shows layout labels and lets the user hide them", () => {
    const page = buildPage();
    page.layoutOverrides = [
      {
        element_id: "gallery-1",
        type: "rowGallery",
        photos: "$$gallery$$",
        tag: "gallery",
        fit: "cover",
        position: { x: 0, y: 0 },
        width: 400,
        height: 200,
      },
    ];

    render(<FreeLayoutEditor page={page} onLayoutChange={vi.fn()} />);

    expect(screen.getByText("rowGallery · gallery")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hide Labels" }));

    expect(screen.queryByText("rowGallery · gallery")).toBeNull();
    expect(screen.getByRole("button", { name: "Show Labels" })).toBeTruthy();
  });
});
