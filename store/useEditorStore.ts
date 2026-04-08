"use client";

import { create } from "zustand";

import type { EditorState, SelectedElementRef } from "@/types/editor";
import type { Crop } from "@/types/project";

type EditorStore = EditorState & {
  initialize: (payload: {
    sectionOrder: string[];
    selectedPageId: string | null;
  }) => void;
  setSelectedPageId: (pageId: string | null) => void;
  setSelectedElement: (element: SelectedElementRef | null) => void;
  setCropDraft: (crop: Crop) => void;
  setTextDraft: (value: string) => void;
  setSectionOrder: (order: string[]) => void;
  reset: () => void;
};

const initialState: EditorState = {
  selectedPageId: null,
  selectedElement: null,
  cropDraft: { x: 0.5, y: 0.5, scale: 1 },
  textDraft: "",
  sectionOrder: [],
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,
  initialize: ({ sectionOrder, selectedPageId }) =>
    set((state) => ({
      ...state,
      sectionOrder,
      selectedPageId,
    })),
  setSelectedPageId: (selectedPageId) => set({ selectedPageId }),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  setCropDraft: (cropDraft) => set({ cropDraft }),
  setTextDraft: (textDraft) => set({ textDraft }),
  setSectionOrder: (sectionOrder) => set({ sectionOrder }),
  reset: () => set(initialState),
}));
