"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { InspectorPanel } from "@/components/editor/InspectorPanel";
import { PageCanvas } from "@/components/editor/PageCanvas";
import { SectionList } from "@/components/editor/SectionList";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookPreviewModal } from "@/components/preview/BookPreviewModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { getMinimumPageCount } from "@/lib/spec-canvas";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, TemplateLayoutElement, TemplateParameterValue } from "@/types/project";

const hasRenderableSchema = (
  page: Project["generatedSections"][number]["pages"][number] | null | undefined,
) =>
  Boolean(
    page &&
      page.schema &&
      page.schema.layout &&
      Array.isArray(page.schema.layout.elements),
  );

const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json().catch(() => null)) as
    | { url?: string; message?: string }
    | null;
  if (!response.ok || !data?.url) {
    throw new Error(data?.message ?? "이미지 업로드에 실패했습니다.");
  }
  return data.url;
};

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);

  const project = useProjectStore((state) => state.projects[params.id]);
  const replaceSections = useProjectStore((state) => state.replaceSections);
  const duplicateSection = useProjectStore((state) => state.duplicateSection);
  const deleteSection = useProjectStore((state) => state.deleteSection);
  const updatePageParameters = useProjectStore(
    (state) => state.updatePageParameters,
  );
  const updatePageLayoutOverride = useProjectStore(
    (state) => state.updatePageLayoutOverride,
  );
  const updateProjectTitle = useProjectStore((state) => state.updateProjectTitle);
  const setEstimate = useProjectStore((state) => state.setEstimate);
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const clearEstimate = useProjectStore((state) => state.clearEstimate);

  useEffect(() => {
    if (!project || selectedSectionId) {
      return;
    }

    setSelectedSectionId(project.generatedSections[0]?.id ?? null);
  }, [project, selectedSectionId]);

  const orderedSections = useMemo(
    () => project?.generatedSections ?? [],
    [project],
  );

  const selectedSection =
    orderedSections.find((section) => section.id === selectedSectionId) ??
    orderedSections[0] ??
    null;
  const selectedPage = hasRenderableSchema(selectedSection?.pages[0])
    ? selectedSection.pages[0]
    : null;

  const totalPhotoCount = useMemo(() => {
    if (!project) return 0;
    let count = 0;
    for (const section of project.generatedSections) {
      for (const page of section.pages) {
        for (const [key, def] of Object.entries(
          page.schema?.parameterDefinitions ?? {},
        )) {
          const val = page.parameters[key];
          if (def.binding === "file" && typeof val === "string" && val !== "") {
            count++;
          }
          if (
            (def.binding === "rowGallery" ||
              def.binding === "columnGallery" ||
              def.binding === "collageGallery" ||
              def.type === "array") &&
            Array.isArray(val)
          ) {
            count += val.filter((v) => typeof v === "string" && v !== "").length;
          }
        }
      }
    }
    return count;
  }, [project]);

  const handleMoveSection = async (
    sectionId: string,
    direction: "up" | "down",
  ) => {
    if (!project) {
      return;
    }

    const nextOrder = orderedSections.map((section) => section.id);
    const index = nextOrder.indexOf(sectionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= nextOrder.length) {
      return;
    }

    [nextOrder[index], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[index],
    ];

    const response = await fetch(`/api/projects/${project.id}/layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project,
        sectionOrder: nextOrder,
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { project: Project };
    replaceSections(project.id, payload.project.generatedSections);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!project) {
      return;
    }

    const index = orderedSections.findIndex((section) => section.id === sectionId);

    if (index < 0) {
      return;
    }

    const remainingSections = orderedSections.filter(
      (section) => section.id !== sectionId,
    );

    deleteSection(project.id, sectionId);

    if (selectedSectionId !== sectionId) {
      return;
    }

    const fallbackSection =
      remainingSections[Math.min(index, remainingSections.length - 1)] ?? null;

    setSelectedSectionId(fallbackSection?.id ?? null);
    setSelectedFieldKey(null);
  };

  const handleParameterChange = (
    fieldKey: string,
    value: TemplateParameterValue,
  ) => {
    if (!project || !selectedPage) {
      return;
    }

    updatePageParameters(project.id, selectedPage.id, (current) => ({
      ...current,
      [fieldKey]: value,
    }));
    setSelectedFieldKey(fieldKey);
  };

  const handleFileChange = async (fieldKey: string, file: File, index?: number) => {
    if (!project || !selectedPage) {
      return;
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadImageFile(file);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
      return;
    }

    updatePageParameters(project.id, selectedPage.id, (current) => {
      const currentValue = current[fieldKey];

      if (typeof index === "number") {
        const next = Array.isArray(currentValue) ? [...currentValue] : [];
        next[index] = imageUrl;
        return {
          ...current,
          [fieldKey]: next,
        };
      }

      return {
        ...current,
        [fieldKey]: imageUrl,
      };
    });
    setSelectedFieldKey(fieldKey);
  };

  const handleLayoutChange = (pageId: string, elements: TemplateLayoutElement[]) => {
    if (!project) return;
    updatePageLayoutOverride(project.id, pageId, elements);
  };

  const handleEstimate = async () => {
    if (!project) {
      return;
    }

    if (isBelowMinimumPageCount) {
      alert(`최소 ${requiredMinPages}페이지를 채워야 결제로 이동할 수 있습니다.`);
      return;
    }

    let publishedProject = project;

    // 미출판 상태면 출판을 먼저 완료한다
    if (!project.sweetbookBookUid || project.status !== "published") {
      setIsPublishing(true);
      try {
        const publishResponse = await fetch(`/api/projects/${project.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project }),
        });

        const publishPayload = (await publishResponse.json().catch(() => null)) as
          | { project: Project; message?: string }
          | null;

        if (!publishResponse.ok || !publishPayload?.project) {
          throw new Error(publishPayload?.message ?? "책을 출판하지 못했습니다.");
        }

        upsertProject(publishPayload.project);
        clearEstimate(project.id);
        publishedProject = publishPayload.project;
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "출판 중 오류가 발생했습니다.",
        );
        return;
      } finally {
        setIsPublishing(false);
      }
    }

    // 출판 완료 후 견적 계산
    setIsEstimating(true);

    try {
      const response = await fetch(`/api/projects/${publishedProject.id}/estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: publishedProject,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("견적 계산에 실패했습니다.");
      }

      const payload = (await response.json()) as { estimate: Project["estimate"] };

      if (payload.estimate) {
        setEstimate(publishedProject.id, payload.estimate);
      }

      router.push(`/checkout/${publishedProject.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "견적 계산 중 오류가 발생했습니다.",
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
              <p className="display-copy text-4xl text-foreground">
                프로젝트를 찾을 수 없음
              </p>
              <p className="editorial-copy mt-4 text-sm">
                로컬 상태에 프로젝트 데이터가 없습니다. 스튜디오에서 새 프로젝트를 시작하고 템플릿 페이지를 다시 생성하세요.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">새 프로젝트</Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  if (project.generatedSections.length > 0 && !selectedPage) {
    return (
      <>
        <Header />
        <main className="px-6 py-16 md:px-0">
          <Container>
            <Card className="bg-surface-container-low p-10 text-center shadow-none">
              <p className="display-copy text-4xl text-foreground">
                다시 생성 필요
              </p>
              <p className="editorial-copy mt-4 text-sm">
                저장된 프로젝트 데이터가 손상되어 편집할 수 없습니다. 스튜디오로 돌아가서 처음부터 다시 시작해주세요.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/studio/new">스튜디오로 돌아가기</Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const pageCount = orderedSections.reduce(
    (count, section) => count + section.pages.length,
    0,
  );
  const requiredMinPages = getMinimumPageCount(project.bookSpecId);
  const isBelowMinimumPageCount = pageCount < requiredMinPages;

  return (
    <>
      <Header />
      <main className="py-8">
        <Container>
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-5">
                <StepIndicator currentStep={2} projectId={params.id} />
              </div>
              <p className="section-label">템플릿 편집기</p>
              <div className="mt-4 max-w-2xl">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-2">
                  포토북 제목
                </label>
                <input
                  className="w-full rounded-2xl border-2 border-outline/30 bg-surface-container-low px-5 py-3 text-xl font-semibold text-foreground outline-none placeholder:text-outline-strong transition focus:border-primary focus:bg-white"
                  value={titleDraft ?? project.title}
                  placeholder="포토북 제목을 입력하세요"
                  maxLength={255}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    const next = (titleDraft ?? "").trim();
                    if (next && next !== project.title) {
                      updateProjectTitle(project.id, next);
                    } else if (!next) {
                      setTitleDraft(project.title);
                    }
                    setTitleDraft(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </div>
              <p className="editorial-copy mt-3 max-w-2xl text-sm">
                텍스트·이미지·갤러리를 편집한 뒤 결제로 이동하세요.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(true)}>
                미리보기
              </Button>
              <Button onClick={handleEstimate} disabled={isPublishing || isEstimating}>
                {isPublishing ? "출판 중..." : isEstimating ? "계산 중..." : "결제하기"}
              </Button>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-6 rounded-full bg-surface-container-low px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            <span>{project.templateId}</span>
            <span>{project.bookSpecId}</span>
            <span className={isBelowMinimumPageCount ? "text-red-500" : ""}>
              {`${pageCount}페이지`}
              {isBelowMinimumPageCount &&
                ` (최소 ${requiredMinPages}페이지 필요)`}
            </span>
          </div>
        </Container>

        {/* 캔버스 그리드 */}
        <div className="mx-auto mt-6 grid w-full max-w-7xl items-start gap-4 px-4 md:px-8 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
            <aside className="glass-panel rounded-[1.75rem] p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
              <div className="mb-6">
                <p className="display-copy text-3xl text-foreground">
                  페이지
                </p>
                <p className="section-label mt-2">섹션 순서</p>
              </div>
              <SectionList
                sections={orderedSections}
                selectedSectionId={selectedSection?.id ?? null}
                onSelect={(sectionId) => {
                  setSelectedSectionId(sectionId);
                  setSelectedFieldKey(null);
                }}
                onMove={handleMoveSection}
                onDuplicate={(sectionId) => {
                  duplicateSection(project.id, sectionId);
                }}
                onDelete={handleDeleteSection}
              />
            </aside>

            <section className="space-y-6">
              {selectedPage ? (
                <PageCanvas
                  page={selectedPage}
                  selectedFieldKey={selectedFieldKey}
                  onSelectField={setSelectedFieldKey}
                  onLayoutChange={handleLayoutChange}
                />
              ) : (
                <Card className="bg-surface-container-low p-10 text-center shadow-none">
                  <p className="section-label">페이지를 선택하세요</p>
                </Card>
              )}

              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                <button
                  type="button"
                  className="transition hover:text-primary"
                  onClick={() => {
                    if (!selectedSection) return;
                    const index = orderedSections.findIndex(
                      (section) => section.id === selectedSection.id,
                    );
                    const target = orderedSections[index - 1];
                    if (target) {
                      setSelectedSectionId(target.id);
                      setSelectedFieldKey(null);
                    }
                  }}
                >
                  이전
                </button>
                <div className="flex gap-2">
                  {orderedSections.slice(0, 8).map((section) => (
                    <span
                      key={section.id}
                      className={`h-2 w-2 rounded-full ${
                        section.id === selectedSection?.id
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
                    if (!selectedSection) return;
                    const index = orderedSections.findIndex(
                      (section) => section.id === selectedSection.id,
                    );
                    const target = orderedSections[index + 1];
                    if (target) {
                      setSelectedSectionId(target.id);
                      setSelectedFieldKey(null);
                    }
                  }}
                >
                  다음
                </button>
              </div>
            </section>

            <InspectorPanel
              className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto"
              page={selectedPage}
              selectedFieldKey={selectedFieldKey}
              onSelectField={setSelectedFieldKey}
              onParameterChange={handleParameterChange}
              onFileChange={handleFileChange}
              totalPhotoCount={totalPhotoCount}
            />
          </div>
      </main>

      <BookPreviewModal
        project={project}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
