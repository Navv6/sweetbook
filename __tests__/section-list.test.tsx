import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SectionList } from "@/components/editor/SectionList";
import type { GeneratedSection } from "@/types/project";

const buildSection = (
  id: string,
  kind: "content" | "cover" | "publish" = "content",
): GeneratedSection => ({
  id,
  title: `Section ${id}`,
  intro: `Intro ${id}`,
  coverText: `Cover ${id}`,
  pages: [
    {
      id: `page-${id}`,
      sectionId: id,
      pageNumber: 1,
      kind,
      templateUid: `template-${id}`,
      templateName: `Template ${id}`,
      schema: {
        id: `schema-${id}`,
        name: `Schema ${id}`,
        description: `Schema for ${id}`,
        templateKind: kind === "content" ? "content" : kind,
        theme: "editorial",
        bookSpecId: "square-softcover",
        parameterDefinitions: {},
        layout: {
          width: 1200,
          height: 1200,
          elements: [],
        },
      },
      parameters: {},
      assignedContentItemIds: [],
    },
  ],
});

describe("SectionList", () => {
  it("calls onDelete with the section id when the delete button is clicked", () => {
    const onDelete = vi.fn();

    render(
      <SectionList
        sections={[buildSection("section-1")]}
        selectedSectionId="section-1"
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "섹션 삭제" }));

    expect(onDelete).toHaveBeenCalledWith("section-1");
  });
});
