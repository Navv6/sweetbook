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
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, TemplateParameterValue } from "@/types/project";

const hasRenderableSchema = (
  page: Project["generatedSections"][number]["pages"][number] | null | undefined,
) =>
  Boolean(
    page &&
      page.schema &&
      page.schema.layout &&
      Array.isArray(page.schema.layout.elements),
  );

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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  const project = useProjectStore((state) => state.projects[params.id]);
  const replaceSections = useProjectStore((state) => state.replaceSections);
  const updatePageParameters = useProjectStore(
    (state) => state.updatePageParameters,
  );
  const setEstimate = useProjectStore((state) => state.setEstimate);

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

    const imageUrl = await readFileAsDataUrl(file);

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

  const handleEstimate = async () => {
    if (!project) {
      return;
    }

    if (!project.sweetbookBookUid || project.status !== "published") {
      router.push(`/checkout/${project.id}`);
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
        throw new Error("견적 계산에 실패했습니다.");
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
              <p className="display-copy text-4xl italic text-foreground">
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
              <p className="display-copy text-4xl italic text-foreground">
                다시 생성 필요
              </p>
              <p className="editorial-copy mt-4 text-sm">
                저장된 프로젝트 데이터에 편집기에 필요한 SweetBook 스키마가 없습니다. 스튜디오로 돌아가서 템플릿 페이지를 다시 생성하세요.
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

  return (
    <>
      <Header />
      <main className="px-6 py-8 md:px-0">
        <Container>
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="section-label">템플릿 편집기</p>
              <h1 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
                {project.title}
              </h1>
              <p className="editorial-copy mt-4 max-w-2xl text-sm">
                선택한 템플릿 스키마 기반으로 각 페이지를 구성합니다. 텍스트, 이미지, 갤러리 파라미터를 편집하고 페이지 순서를 확인한 뒤 결제로 이동하세요.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(true)}>
                미리보기
              </Button>
              <Button onClick={handleEstimate} disabled={isEstimating}>
                {isEstimating ? "계산 중..." : "결제하기"}
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-6 rounded-full bg-surface-container-low px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            <span>{project.templateId}</span>
            <span>{project.bookSpecId}</span>
            <span>{`${pageCount}페이지`}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1.75fr)_320px]">
            <aside className="glass-panel rounded-[1.75rem] p-6">
              <div className="mb-6">
                <p className="display-copy text-3xl italic text-foreground">
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
              />
            </aside>

            <section className="space-y-6">
              {selectedPage ? (
                <PageCanvas
                  page={selectedPage}
                  selectedFieldKey={selectedFieldKey}
                  onSelectField={setSelectedFieldKey}
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
              page={selectedPage}
              selectedFieldKey={selectedFieldKey}
              onSelectField={setSelectedFieldKey}
              onParameterChange={handleParameterChange}
              onFileChange={handleFileChange}
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
