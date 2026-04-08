"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InspectorPanel } from "@/components/editor/InspectorPanel";
import { PageCanvas } from "@/components/editor/PageCanvas";
import { SectionList } from "@/components/editor/SectionList";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookPreviewModal } from "@/components/preview/BookPreviewModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEditorStore } from "@/store/useEditorStore";
import { useProjectStore } from "@/store/useProjectStore";
import type { GeneratedSection, PageElement, Project } from "@/types/project";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isEstimating, setIsEstimating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const project = useProjectStore((state) => state.projects[params.id]);
  const replaceSections = useProjectStore((state) => state.replaceSections);
  const updateElement = useProjectStore((state) => state.updateElement);
  const replaceContentItemImage = useProjectStore(
    (state) => state.replaceContentItemImage,
  );
  const setEstimate = useProjectStore((state) => state.setEstimate);

  const {
    selectedPageId,
    selectedElement,
    cropDraft,
    textDraft,
    sectionOrder,
    initialize,
    setSelectedPageId,
    setSelectedElement,
    setCropDraft,
    setTextDraft,
    setSectionOrder,
  } = useEditorStore();

  useEffect(() => {
    if (!project || sectionOrder.length > 0) {
      return;
    }

    initialize({
      sectionOrder: project.generatedSections.map((section) => section.id),
      selectedPageId: project.generatedSections[0]?.pages[0]?.id ?? null,
    });
  }, [initialize, project, sectionOrder.length]);

  const orderedSections: GeneratedSection[] = !project
    ? []
    : sectionOrder.length === 0
      ? project.generatedSections
      : sectionOrder
          .map((sectionId) =>
            project.generatedSections.find((section) => section.id === sectionId),
          )
          .filter((section): section is GeneratedSection => Boolean(section));

  const pages = orderedSections.flatMap((section) => section.pages);
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];
  const selectedSectionId = selectedElement?.sectionId ?? orderedSections[0]?.id ?? null;
  const selectedElementObject =
    selectedElement && selectedPage
      ? selectedPage.elements.find(
          (element) => element.id === selectedElement.elementId,
        ) ??
        pages
          .flatMap((page) => page.elements)
          .find((element) => element.id === selectedElement.elementId) ??
        null
      : null;

  const selectElement = (element: PageElement) => {
    if (!selectedPage) {
      return;
    }

    setSelectedElement({
      sectionId: selectedPage.sectionId,
      pageId: selectedPage.id,
      elementId: element.id,
    });

    if (element.type === "text") {
      setTextDraft(element.value);
    } else {
      setCropDraft(element.crop);
    }
  };

  const handleMoveSection = async (sectionId: string, direction: "up" | "down") => {
    const currentOrder =
      sectionOrder.length > 0
        ? [...sectionOrder]
        : orderedSections.map((section) => section.id);
    const index = currentOrder.indexOf(sectionId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (
      index < 0 ||
      nextIndex < 0 ||
      nextIndex >= currentOrder.length ||
      !project
    ) {
      return;
    }

    [currentOrder[index], currentOrder[nextIndex]] = [
      currentOrder[nextIndex],
      currentOrder[index],
    ];
    setSectionOrder(currentOrder);

    const response = await fetch(`/api/projects/${project.id}/layout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
        sectionOrder: currentOrder,
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { project: Project };
    replaceSections(project.id, payload.project.generatedSections);
  };

  const handleTextChange = (value: string) => {
    if (!selectedElement || !project) {
      return;
    }

    setTextDraft(value);
    updateElement(
      project.id,
      selectedElement.pageId,
      selectedElement.elementId,
      (element) =>
        element.type === "text"
          ? {
              ...element,
              value,
            }
          : element,
    );
  };

  const handleCropChange = (key: "x" | "y" | "scale", value: number) => {
    if (!selectedElement || !project) {
      return;
    }

    const nextCrop = {
      ...cropDraft,
      [key]: value,
    };
    setCropDraft(nextCrop);
    updateElement(
      project.id,
      selectedElement.pageId,
      selectedElement.elementId,
      (element) =>
        element.type === "image"
          ? {
              ...element,
              crop: nextCrop,
            }
          : element,
    );
  };

  const handleImageReplace = async (file: File) => {
    if (!selectedElement || !selectedElementObject || !project) {
      return;
    }

    const imageUrl = await readFileAsDataUrl(file);

    if (
      selectedElementObject.type === "image" &&
      selectedElementObject.contentItemId
    ) {
      replaceContentItemImage(
        project.id,
        selectedElementObject.contentItemId,
        imageUrl,
      );
    } else {
      updateElement(
        project.id,
        selectedElement.pageId,
        selectedElement.elementId,
        (element) =>
          element.type === "image"
            ? {
                ...element,
                imageUrl,
              }
            : element,
      );
    }
  };

  const handleEstimate = async () => {
    if (!project) {
      return;
    }

    setIsEstimating(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "\uACAC\uC801 \uACC4\uC0B0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        );
      }

      const payload = (await response.json()) as { estimate: Project["estimate"] };

      if (payload.estimate) {
        setEstimate(project.id, payload.estimate);
      }

      router.push(`/checkout/${project.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "\uACAC\uC801 \uACC4\uC0B0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
      );
    } finally {
      setIsEstimating(false);
    }
  };

  if (!project) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl italic text-foreground">
                {"Missing Project"}
              </p>
              <p className="editorial-copy mt-4 text-sm">
                {
                  "\uD504\uB85C\uC81D\uD2B8 \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8 \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uAC70\uB098 \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694."
                }
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">
                  {"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-8 md:px-0">
        <Container>
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="section-label">
                {"\uC5D0\uB514\uD1A0\uB9AC\uC5BC \uC5D0\uB514\uD130"}
              </p>
              <h1 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
                {project.title}
              </h1>
              <p className="editorial-copy mt-4 max-w-2xl text-sm">
                {
                  "\uC139\uC158 \uC21C\uC11C\uB97C \uC815\uB9AC\uD558\uACE0, \uD14D\uC2A4\uD2B8\uC640 \uC774\uBBF8\uC9C0\uB97C \uC81C\uD55C\uB41C \uBC94\uC704\uC5D0\uC11C \uC870\uC815\uD55C \uB4A4 SweetBook \uCD9C\uD310 \uB2E8\uACC4\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4."
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsPreviewOpen(true)}
              >
                {"📖 책 미리보기"}
              </Button>
              <Button onClick={handleEstimate} disabled={isEstimating}>
                {isEstimating ? "견적 계산 중..." : "미리보기 및 주문"}
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-6 rounded-full bg-surface-container-low px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            <span>{"AI Layout On"}</span>
            <span>{"Real-Time Preview"}</span>
            <span>{`${pages.length} Pages`}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.35fr_0.78fr]">
            <aside className="glass-panel rounded-[1.75rem] p-6">
              <div className="mb-6">
                <p className="display-copy text-3xl italic text-foreground">
                  {"Editor"}
                </p>
                <p className="section-label mt-2">
                  {"\uB4DC\uB798\uD504\uD2B8 \uBAA8\uB4DC"}
                </p>
              </div>
              <SectionList
                sections={orderedSections}
                selectedSectionId={selectedSectionId}
                onSelect={(sectionId) => {
                  const pageId =
                    orderedSections.find((section) => section.id === sectionId)
                      ?.pages[0]?.id ?? null;
                  setSelectedPageId(pageId);
                  setSelectedElement(null);
                }}
                onMove={handleMoveSection}
              />
            </aside>

            <section className="space-y-6">
              {selectedPage && (
                <PageCanvas
                  page={selectedPage}
                  selectedElementId={selectedElement?.elementId ?? null}
                  onSelectElement={selectElement}
                />
              )}

              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                <button
                  type="button"
                  className="transition hover:text-primary"
                  onClick={() => {
                    if (!selectedPage) return;
                    const index = pages.findIndex(
                      (page) => page.id === selectedPage.id,
                    );
                    const target = pages[index - 1];
                    if (target) {
                      setSelectedPageId(target.id);
                      setSelectedElement(null);
                    }
                  }}
                >
                  {"\uC774\uC804 \uC2A4\uD504\uB808\uB4DC"}
                </button>
                <div className="flex gap-2">
                  {pages.slice(0, 4).map((page) => (
                    <span
                      key={page.id}
                      className={`h-2 w-2 rounded-full ${
                        page.id === selectedPage?.id
                          ? "bg-primary"
                          : "bg-primary/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="transition hover:text-primary"
                  onClick={() => {
                    if (!selectedPage) return;
                    const index = pages.findIndex(
                      (page) => page.id === selectedPage.id,
                    );
                    const target = pages[index + 1];
                    if (target) {
                      setSelectedPageId(target.id);
                      setSelectedElement(null);
                    }
                  }}
                >
                  {"\uB2E4\uC74C \uC2A4\uD504\uB808\uB4DC"}
                </button>
              </div>
            </section>

            <InspectorPanel
              selectedElement={selectedElementObject}
              textDraft={textDraft}
              cropDraft={cropDraft}
              onTextChange={handleTextChange}
              onCropChange={handleCropChange}
              onImageReplace={handleImageReplace}
            />
          </div>
        </Container>
      </main>

      <BookPreviewModal
        project={project}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
