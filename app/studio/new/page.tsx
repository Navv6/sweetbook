"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookSpecSelector } from "@/components/studio/BookSpecSelector";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { TemplateSelector } from "@/components/studio/TemplateSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { curatedThemeFamilies } from "@/lib/curated-theme-families";
import { useProjectStore } from "@/store/useProjectStore";
import type {
  BookSpecOption,
  CatalogSummary,
  ContentItem,
  Project,
  TemplateOption,
} from "@/types/project";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function NewProjectPage() {
  const router = useRouter();
  const upsertProject = useProjectStore((state) => state.upsertProject);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [bookSpecs, setBookSpecs] = useState<BookSpecOption[]>([]);
  const [title, setTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBookSpecId, setSelectedBookSpecId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
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
    !selectedTemplate ||
    !selectedBookSpecId ||
    !hasLiveCatalog ||
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

  const handleCoverUpload = async (file: File) => {
    const imageUrl = await readFileAsDataUrl(file);
    setCoverImageUrl(imageUrl);
  };

  const handleContentUpload = async (files: FileList) => {
    const uploadedItems = await Promise.all(
      Array.from(files).map(async (file, index) => ({
        id: crypto.randomUUID(),
        kind: "image" as const,
        title: file.name.replace(/\.[^.]+$/, "") || `업로드 ${index + 1}`,
        imageUrl: await readFileAsDataUrl(file),
        fileName: file.name,
        createdAt: new Date().toISOString(),
      })),
    );

    setContentItems(uploadedItems);
  };

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
          title,
          templateId: selectedTemplate.id,
          bookSpecId: selectedBookSpec.id,
          coverImageUrl,
          contentItems,
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
            <p className="section-label">큐레이션 스튜디오</p>
            <h1 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              테마 패밀리를 고르고 실제 템플릿을 구성하세요
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              테마 패밀리와 판형을 선택하고, 표지 이미지와 콘텐츠 사진을 업로드한 뒤 페이지를 생성하세요.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="space-y-5">
                  <div>
                    <label className="section-label block">프로젝트 제목</label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-3"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-2xl bg-surface-container-lowest p-5">
                      <p className="section-label">표지 이미지</p>
                      <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low px-4 text-center overflow-hidden relative">
                        {coverImageUrl ? (
                          <>
                            <img
                              src={coverImageUrl}
                              alt="표지 미리보기"
                              className="absolute inset-0 h-full w-full object-cover rounded-xl"
                            />
                            <span className="relative z-10 rounded-md bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                              변경
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="display-copy text-3xl italic text-foreground">
                              표지
                            </span>
                            <span className="editorial-copy mt-3 text-sm">
                              표지에 사용할 이미지를 업로드하세요.
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleCoverUpload(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl bg-surface-container-lowest p-5">
                      <div className="flex items-center justify-between">
                        <p className="section-label">콘텐츠 이미지</p>
                      </div>
                      <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low px-4 text-center">
                        {contentItems.length > 0 ? (
                          <>
                            <span className="display-copy text-3xl italic text-foreground">
                              {contentItems.length}장
                            </span>
                            <span className="editorial-copy mt-3 text-sm">
                              클릭하여 다시 업로드
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="display-copy text-3xl italic text-foreground">
                              업로드
                            </span>
                            <span className="editorial-copy mt-3 text-sm">
                              갤러리와 콘텐츠 슬롯을 채울 사진을 여러 장 업로드하세요.
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const files = event.target.files;
                            if (files && files.length > 0) {
                              void handleContentUpload(files);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                  {contentItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-surface-container-lowest p-3"
                      >
                        <div
                          className="aspect-[4/3] rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                        <p className="mt-3 truncate text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">책 사양</p>
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

              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="section-label">테마 패밀리</p>
                    {catalogNotice && (
                      <p className="editorial-copy mt-3 text-xs text-secondary">
                        {catalogNotice}
                      </p>
                    )}
                  </div>
                  {templateSummary && (
                    <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                        카탈로그
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {`${templateSummary.familyCount}개 패밀리 / ${templateSummary.totalTemplates}개 템플릿`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  {galleryTemplates.length > 0 ? (
                    <TemplateSelector
                      templates={galleryTemplates}
                      selectedTemplateId={selectedTemplateId ?? ""}
                      onSelect={setSelectedTemplateId}
                    />
                  ) : (
                    <div className="rounded-2xl bg-surface-container-lowest px-5 py-6 text-sm text-secondary">
                      사용 가능한 테마 패밀리가 없습니다.
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

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isCatalogLoading ||
                    isGenerating ||
                    !selectedTemplate ||
                    !selectedBookSpec ||
                    !selectedTemplateIsAvailable
                  }
                  className="min-w-52"
                >
                  {isGenerating ? "생성 중..." : "페이지 생성하기"}
                </Button>
              </div>
            </section>

            {selectedTemplate && selectedBookSpec ? (
              <PreviewPanel
                title={title}
                template={selectedTemplate}
                bookSpec={selectedBookSpec}
                coverImageUrl={coverImageUrl}
                imageCount={contentItems.length}
              />
            ) : (
              <aside className="glass-panel sticky top-28 rounded-[2rem] p-6">
                <div className="rounded-2xl bg-surface-container-low p-8 text-sm text-secondary">
                  {isCatalogLoading
                    ? "카탈로그 불러오는 중..."
                    : "책 사양과 테마 패밀리를 선택하면 미리보기가 표시됩니다."}
                </div>
              </aside>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
