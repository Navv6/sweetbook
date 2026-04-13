export type SelectedFieldRef = {
  sectionId: string;
  pageId: string;
  fieldKey: string;
};

export type EditorState = {
  selectedPageId: string | null;
  selectedField: SelectedFieldRef | null;
  sectionOrder: string[];
};
