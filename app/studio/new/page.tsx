"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookSpecSelector } from "@/components/studio/BookSpecSelector";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { TemplateSelector } from "@/components/studio/TemplateSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { curatedThemeFamilies } from "@/lib/curated-theme-families";
import { useProjectStore } from "@/store/useProjectStore";
import type {
  BookSpecOption,
  CatalogSummary,
  Project,
  TemplateOption,
} from "@/types/project";

export default function NewProjectPage() {
  const router = useRouter();
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [bookSpecs, setBookSpecs] = useState<BookSpecOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBookSpecId, setSelectedBookSpecId] = useState<string | null>(null);
  const [templateSummary, setTemplateSummary] = useState<CatalogSummary | null>(
    null,
  );
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const liveTemplatesById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );
  const galleryTemplates = useMemo(
    () =>
      templates.map((liveTemplate) => {
        const curatedTemplate = liveTemplatesById.has(liveTemplate.id)
          ? curatedThemeFamilies.find((template) => template.id === liveTemplate.id)
          : undefined;

        if (!curatedTemplate) {
          return liveTemplate;
        }

        return {
          ...liveTemplate,
          ...curatedTemplate,
          bookSpecIds: liveTemplate.bookSpecIds,
          templateKinds: liveTemplate.templateKinds,
          templateCount: liveTemplate.templateCount,
          variants: liveTemplate.variants,
          thumbnailUrl: curatedTemplate.thumbnailUrl ?? liveTemplate.thumbnailUrl,
        };
      }),
    [liveTemplatesById, templates],
  );
  const availableTemplateIds = useMemo(
    () =>
      new Set(
        templates
          .filter((template) =>
            selectedBookSpecId ? template.bookSpecIds.includes(selectedBookSpecId) : true,
          )
          .map((template) => template.id),
      ),
    [selectedBookSpecId, templates],
  );
  const selectedTemplate =
    galleryTemplates.find((template) => template.id === selectedTemplateId) ??
    galleryTemplates[0] ??
    null;
  const selectedBookSpec =
    bookSpecs.find((bookSpec) => bookSpec.id === selectedBookSpecId) ??
    bookSpecs[0] ??
    null;
  const hasLiveCatalog = templates.length > 0;
  const selectedTemplateIsAvailable =
    !selectedBookSpecId ||
    !hasLiveCatalog ||
    !selectedTemplate ||
    availableTemplateIds.has(selectedTemplate.id);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/catalog", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("카탈로그를 불러오지 못했습니다.");
        }

        return response.json() as Promise<{
          templates: TemplateOption[];
          bookSpecs: BookSpecOption[];
          templateSummary: CatalogSummary;
          message: string;
        }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        if (payload.templates.length > 0) {
          setTemplates(payload.templates);
        }

        if (payload.bookSpecs.length > 0) {
          setBookSpecs(payload.bookSpecs);
        }

        setTemplateSummary(payload.templateSummary);
        setCatalogNotice(payload.message);
        setIsCatalogLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          setTemplates([]);
          setBookSpecs([]);
          setCatalogNotice(
            error instanceof Error
              ? error.message
              : "SweetBook 카탈로그를 불러오지 못했습니다.",
          );
          setIsCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (galleryTemplates.length === 0) {
      return;
    }

    setSelectedTemplateId((current) =>
      current && galleryTemplates.some((template) => template.id === current)
        ? current
        : galleryTemplates[0].id,
    );
  }, [galleryTemplates]);

  useEffect(() => {
    if (bookSpecs.length === 0) {
      return;
    }

    setSelectedBookSpecId((current) =>
      current && bookSpecs.some((bookSpec) => bookSpec.id === current)
        ? current
        : bookSpecs[0].id,
    );
  }, [bookSpecs]);

  const handleSubmit = async () => {
    if (!selectedTemplate || !selectedBookSpec) {
      return;
    }

    setIsGenerating(true);

    try {
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedTemplate.name ?? "내 포토북",
          templateId: selectedTemplate.id,
          bookSpecId: selectedBookSpec.id,
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.json().catch(() => ({})) as { message?: string };
        throw new Error(errorBody.message ?? "프로젝트를 생성하지 못했습니다.");
      }

      const { project } = (await createResponse.json()) as { project: Project };
      upsertProject(project);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "프로젝트 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 md:px-0 md:py-14">
        <Container>
          <div className="mb-10 max-w-3xl">
            <div className="mb-5">
              <StepIndicator currentStep={1} />
            </div>
            <p className="section-label">큐레이션 스튜디오</p>
            <h1 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              테마와 판형을 선택하세요
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              원하는 테마 패밀리와 책 판형을 고르면 바로 페이지 생성을 시작합니다.
            </p>
          </div>

          <div className="grid items-stretch gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            {/* 왼쪽: 템플릿 선택 */}
            <section className="flex h-full flex-col">
              <Card className="flex flex-1 flex-col bg-surface-container-low p-8 shadow-none">
                <div>
                  <p className="section-label">테마</p>
                </div>

                <div className="mt-5 flex flex-1 min-h-0 flex-col">
                  {galleryTemplates.length > 0 ? (
                    <TemplateSelector
                      templates={galleryTemplates}
                      selectedTemplateId={selectedTemplateId ?? ""}
                      onSelect={setSelectedTemplateId}
                    />
                  ) : (
                    <div className="rounded-2xl bg-surface-container-lowest px-5 py-6 text-sm text-secondary">
                      {isCatalogLoading
                        ? "테마 패밀리 불러오는 중..."
                        : "사용 가능한 테마 패밀리가 없습니다."}
                    </div>
                  )}
                  {!isCatalogLoading &&
                    selectedBookSpecId &&
                    selectedTemplate &&
                    !selectedTemplateIsAvailable && (
                      <div className="mt-4 rounded-2xl bg-surface-container-lowest px-5 py-4 text-sm text-secondary">
                        선택한 책 사양에서 이 패밀리를 사용할 수 없습니다.
                      </div>
                    )}
                </div>
              </Card>
            </section>

            {/* 오른쪽: 프리뷰 + 판형 선택 */}
            <aside className="space-y-6">
              {selectedTemplate && selectedBookSpec ? (
                <PreviewPanel
                  template={selectedTemplate}
                  bookSpec={selectedBookSpec}
                  headerAction={
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        isCatalogLoading ||
                        isGenerating ||
                        !selectedTemplateIsAvailable
                      }
                      className="min-w-44"
                    >
                      {isGenerating ? "생성 중..." : "페이지 생성하기"}
                    </Button>
                  }
                />
              ) : (
                <div className="glass-panel sticky top-28 rounded-[2rem] p-6">
                  <div className="rounded-2xl bg-surface-container-low p-8 text-sm text-secondary">
                    {isCatalogLoading
                      ? "카탈로그 불러오는 중..."
                      : "테마 패밀리를 선택하면 미리보기가 표시됩니다."}
                  </div>
                </div>
              )}

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">판형 선택</p>
                <div className="mt-5">
                  {isCatalogLoading ? (
                    <div className="rounded-2xl bg-surface-container-lowest px-5 py-6 text-sm text-secondary">
                      책 사양 불러오는 중...
                    </div>
                  ) : (
                    <BookSpecSelector
                      bookSpecs={bookSpecs}
                      selectedBookSpecId={selectedBookSpecId ?? ""}
                      onSelect={setSelectedBookSpecId}
                    />
                  )}
                </div>
              </Card>

            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
