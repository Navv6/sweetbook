"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ContentItem,
  Estimate,
  GeneratedSection,
  Order,
  Project,
  TemplateParameterDefinition,
  TemplateParameterValue,
} from "@/types/project";

const sanitizePersistentImageUrl = (value?: string) => {
  if (!value || value.startsWith("data:")) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/demo/") || value.startsWith("/theme/")) {
    return value;
  }

  return undefined;
};

const sanitizeParameterValue = (
  definition: TemplateParameterDefinition | undefined,
  value: TemplateParameterValue,
): TemplateParameterValue => {
  if (definition?.binding === "file") {
    if (typeof value !== "string") {
      return "";
    }

    return sanitizePersistentImageUrl(value) ?? "";
  }

  if (
    definition?.binding === "rowGallery" ||
    definition?.binding === "columnGallery"
  ) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => sanitizePersistentImageUrl(item))
      .filter((item): item is string => Boolean(item));
  }

  return value;
};

const sanitizeProjectForPersist = (project: Project): Project => ({
  ...project,
  coverImageUrl: sanitizePersistentImageUrl(project.coverImageUrl),
  contentItems: project.contentItems.map((item) => ({
    ...item,
    imageUrl: sanitizePersistentImageUrl(item.imageUrl),
  })),
  generatedSections: project.generatedSections.map((section) => ({
    ...section,
    pages: section.pages.map((page) => ({
      id: page.id,
      sectionId: page.sectionId,
      pageNumber: page.pageNumber,
      kind: page.kind,
      templateUid: page.templateUid,
      templateName: page.templateName,
      schema: page.schema,
      parameters: Object.fromEntries(
        Object.entries(page.parameters).map(([key, value]) => [
          key,
          sanitizeParameterValue(page.schema?.parameterDefinitions?.[key], value),
        ]),
      ),
      assignedContentItemIds: page.assignedContentItemIds,
    })),
  })),
});

type ProjectStore = {
  projects: Record<string, Project>;
  currentProjectId: string | null;
  upsertProject: (project: Project) => void;
  setCurrentProjectId: (projectId: string | null) => void;
  getProject: (projectId: string) => Project | undefined;
  replaceSections: (projectId: string, sections: GeneratedSection[]) => void;
  reorderSections: (projectId: string, sectionOrder: string[]) => void;
  duplicateSection: (projectId: string, sectionId: string) => void;
  updatePageParameters: (
    projectId: string,
    pageId: string,
    updater: (
      current: Record<string, TemplateParameterValue>,
    ) => Record<string, TemplateParameterValue>,
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
            let nextPageNumber = 1;
            const reordered = sectionOrder
              .map((sectionId) => mapped.get(sectionId))
              .filter((section): section is GeneratedSection => Boolean(section))
              .map((section) => ({
                ...section,
                pages: section.pages.map((page) => {
                  const renumberedPage = {
                    ...page,
                    pageNumber: nextPageNumber,
                  };
                  nextPageNumber += 1;
                  return renumberedPage;
                }),
              }));

            return {
              ...project,
              generatedSections: reordered,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      duplicateSection: (projectId, sectionId) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => {
            const index = project.generatedSections.findIndex(
              (s) => s.id === sectionId,
            );
            if (index < 0) return project;

            const source = project.generatedSections[index];
            const newSectionId = crypto.randomUUID();
            const duplicate: GeneratedSection = {
              ...source,
              id: newSectionId,
              pages: source.pages.map((page) => ({
                ...page,
                id: crypto.randomUUID(),
                sectionId: newSectionId,
              })),
            };

            const next = [...project.generatedSections];
            next.splice(index + 1, 0, duplicate);

            let pageNumber = 1;
            const renumbered = next.map((section) => ({
              ...section,
              pages: section.pages.map((page) => ({
                ...page,
                pageNumber: pageNumber++,
              })),
            }));

            return {
              ...project,
              generatedSections: renumbered,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      updatePageParameters: (projectId, pageId, updater) =>
        set((state) => ({
          projects: updateProjectRecord(state.projects, projectId, (project) => ({
            ...project,
            generatedSections: project.generatedSections.map((section) => ({
              ...section,
              pages: section.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      parameters: updater(page.parameters),
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
      version: 5,
      partialize: (state) => ({
        projects: Object.fromEntries(
          Object.entries(state.projects).map(([projectId, project]) => [
            projectId,
            sanitizeProjectForPersist(project),
          ]),
        ),
        currentProjectId: state.currentProjectId,
      }),
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              projects?: Record<string, Project>;
              currentProjectId?: string | null;
            }
          | undefined;

        if (!state?.projects) {
          return {
            projects: {},
            currentProjectId: null,
          };
        }

        return {
          projects: Object.fromEntries(
            Object.entries(state.projects).map(([projectId, project]) => [
              projectId,
              sanitizeProjectForPersist(project),
            ]),
          ),
          currentProjectId: state.currentProjectId ?? null,
        };
      },
    },
  ),
);
