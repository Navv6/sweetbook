import type { Crop } from "@/types/project";

export type SelectedElementRef = {
  sectionId: string;
  pageId: string;
  elementId: string;
};

export type EditorState = {
  selectedPageId: string | null;
  selectedElement: SelectedElementRef | null;
  cropDraft: Crop;
  textDraft: string;
  sectionOrder: string[];
};
