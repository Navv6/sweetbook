"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ContentItem,
  Estimate,
  GeneratedSection,
  Order,
  PageElement,
  Project,
} from "@/types/project";

type ProjectStore = {
  projects: Record<string, Project>;
  currentProjectId: string | null;
  upsertProject: (project: Project) => void;
  setCurrentProjectId: (projectId: string | null) => void;
  getProject: (projectId: string) => Project | undefined;
  replaceSections: (projectId: string, sections: GeneratedSection[]) => void;
  reorderSections: (projectId: string, sectionOrder: string[]) => void;
  updateElement: (
    projectId: string,
    pageId: string,
    elementId: string,
    updater: (element: PageElement) => PageElement,
  ) => void;
  replaceContentItemImage: (
    projectId: string,
    contentItemId: string,
    imageUrl: string,
  ) => void;
  setEstimate: (projectId: string, estimate: Estimate) => void;
  setOrder: (projectId: string, order: Order) => void;
};

const updateProjectRecord = (
  projects: Record<string, Project>,
  projectId: string,
  updater: (project: Project) => Project,
) => {
  const project = projects[projectId];

  if (!project) {
    return projects;
  }

  return {
    ...projects,
    [projectId]: updater(project),
  };
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: {},
      currentProjectId: null,
      upsertProject: (project) =>
        set((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
          currentProjectId: project.id,
        })),
      setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),
      getProject: (projectId) => get().projects[projectId],
      replaceSections: (projectId, sections) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            generatedSections: sections,
            updatedAt: new Date().toISOString(),
          })),
        })),
      reorderSections: (projectId, sectionOrder) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => {
            const mapped = new Map(
              project.generatedSections.map((section) => [section.id, section]),
            );
            const reordered = sectionOrder
              .map((sectionId) => mapped.get(sectionId))
              .filter((section): section is GeneratedSection => Boolean(section));

            return {
              ...project,
              generatedSections: reordered,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      updateElement: (projectId, pageId, elementId, updater) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            generatedSections: project.generatedSections.map((section) => ({
              ...section,
              pages: section.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      elements: page.elements.map((element) =>
                        element.id === elementId ? updater(element) : element,
                      ),
                    }
                  : page,
              ),
            })),
            updatedAt: new Date().toISOString(),
          })),
        })),
      replaceContentItemImage: (projectId, contentItemId, imageUrl) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            coverImageUrl:
              project.coverImageUrl && project.contentItems[0]?.id === contentItemId
                ? imageUrl
                : project.coverImageUrl,
            contentItems: project.contentItems.map((item: ContentItem) =>
              item.id === contentItemId
                ? {
                    ...item,
                    imageUrl,
                  }
                : item,
            ),
            generatedSections: project.generatedSections.map((section) => ({
              ...section,
              pages: section.pages.map((page) => ({
                ...page,
                elements: page.elements.map((element) =>
                  element.type === "image" && element.contentItemId === contentItemId
                    ? {
                        ...element,
                        imageUrl,
                      }
                    : element,
                ),
              })),
            })),
            updatedAt: new Date().toISOString(),
          })),
        })),
      setEstimate: (projectId, estimate) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            estimate,
            updatedAt: new Date().toISOString(),
          })),
        })),
      setOrder: (projectId, order) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            order,
            sweetbookOrderUid: order.orderUid,
            status: "ordered",
            updatedAt: new Date().toISOString(),
          })),
        })),
    }),
    {
      name: "sweetbook-project-store",
    },
  ),
);
