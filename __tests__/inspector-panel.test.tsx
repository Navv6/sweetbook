import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InspectorPanel } from "@/components/editor/InspectorPanel";
import type { GeneratedPage } from "@/types/project";

const buildPage = (galleryValue: string[] = []): GeneratedPage => ({
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
      width: 100,
      height: 100,
      elements: [],
    },
  },
  parameters: {
    gallery: galleryValue,
  },
  assignedContentItemIds: [],
});

describe("InspectorPanel gallery fields", () => {
  afterEach(() => {
    cleanup();
  });

  it("adds a gallery slot when the add button is clicked", () => {
    const onParameterChange = vi.fn();

    render(
      <InspectorPanel
        page={buildPage([])}
        selectedFieldKey="gallery"
        onSelectField={vi.fn()}
        onParameterChange={onParameterChange}
        onFileChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "add-gallery-item" }));

    expect(onParameterChange).toHaveBeenCalledWith("gallery", [""]);
  });

  it("removes a gallery slot when the remove button is clicked", () => {
    const onParameterChange = vi.fn();

    render(
      <InspectorPanel
        page={buildPage(["/theme/photo-a.png", "/theme/photo-b.png"])}
        selectedFieldKey="gallery"
        onSelectField={vi.fn()}
        onParameterChange={onParameterChange}
        onFileChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "remove-gallery-0" }));

    expect(onParameterChange).toHaveBeenCalledWith("gallery", [
      "/theme/photo-b.png",
    ]);
  });

  it("disables adding more than four images to a row gallery", () => {
    const view = render(
      <InspectorPanel
        page={buildPage(["1", "2", "3", "4"])}
        selectedFieldKey="gallery"
        onSelectField={vi.fn()}
        onParameterChange={vi.fn()}
        onFileChange={vi.fn()}
      />,
    );
    expect(
      view.getByRole("button", { name: "add-gallery-item" }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
    expect(
      view.getByText("Recommended 4 images. You can add between 1 and 4."),
    ).toBeTruthy();
  });

  it("applies the same four-image cap to collage galleries", () => {
    const page = buildPage(["1", "2", "3", "4"]);
    page.schema.parameterDefinitions.gallery.binding = "collageGallery";

    const view = render(
      <InspectorPanel
        page={page}
        selectedFieldKey="gallery"
        onSelectField={vi.fn()}
        onParameterChange={vi.fn()}
        onFileChange={vi.fn()}
      />,
    );
    expect(
      view.getByRole("button", { name: "add-gallery-item" }).hasAttribute(
        "disabled",
      ),
    ).toBe(true);
    expect(
      view.getByText("Recommended 4 images. You can add between 1 and 4."),
    ).toBeTruthy();
  });
});
