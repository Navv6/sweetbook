"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BookSpecSelector } from "@/components/studio/BookSpecSelector";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { TemplateSelector } from "@/components/studio/TemplateSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  createDemoContentItems,
  mockBookSpecs,
  mockTemplates,
} from "@/lib/mock";
import { useProjectStore } from "@/store/useProjectStore";
import type { ContentItem, Project } from "@/types/project";

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
  const [title, setTitle] = useState("\uC6B0\uB9AC\uC758 \uCCAB \uBC88\uC9F8 \uC544\uCE74\uC774\uBE0C");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    mockTemplates[0].id,
  );
  const [selectedBookSpecId, setSelectedBookSpecId] = useState(
    mockBookSpecs[0].id,
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [contentItems, setContentItems] = useState<ContentItem[]>(
    createDemoContentItems(),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedTemplate =
    mockTemplates.find((template) => template.id === selectedTemplateId) ??
    mockTemplates[0];
  const selectedBookSpec =
    mockBookSpecs.find((bookSpec) => bookSpec.id === selectedBookSpecId) ??
    mockBookSpecs[0];

  const handleCoverUpload = async (file: File) => {
    const imageUrl = await readFileAsDataUrl(file);
    setCoverImageUrl(imageUrl);
  };

  const handleContentUpload = async (files: FileList) => {
    const uploadedItems = await Promise.all(
      Array.from(files).map(async (file, index) => ({
        id: crypto.randomUUID(),
        kind: "image" as const,
        title:
          file.name.replace(/\.[^.]+$/, "") ||
          `\uC5C5\uB85C\uB4DC \uC774\uBBF8\uC9C0 ${index + 1}`,
        imageUrl: await readFileAsDataUrl(file),
        fileName: file.name,
        createdAt: new Date().toISOString(),
      })),
    );

    setContentItems(uploadedItems);
  };

  const handleSubmit = async () => {
    setIsGenerating(true);

    try {
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          templateId: selectedTemplateId,
          bookSpecId: selectedBookSpecId,
          coverImageUrl,
          contentItems,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(
          "\uD504\uB85C\uC81D\uD2B8 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        );
      }

      const createdProject = (await createResponse.json()) as { project: Project };

      const generateResponse = await fetch(
        `/api/projects/${createdProject.project.id}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project: createdProject.project,
          }),
        },
      );

      if (!generateResponse.ok) {
        throw new Error(
          "\uB808\uC774\uC544\uC6C3 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        );
      }

      const generatedProject = (await generateResponse.json()) as {
        project: Project;
      };
      upsertProject(generatedProject.project);
      router.push(`/projects/${generatedProject.project.id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "\uD504\uB85C\uC81D\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
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
            <p className="section-label">
              {"\uD050\uB808\uC774\uC158 \uC2A4\uD29C\uB514\uC624"}
            </p>
            <h1 className="display-copy mt-4 text-4xl font-semibold md:text-6xl">
              {"\uD3EC\uD1A0\uBD81 \uCD08\uC548\uC744 \uC124\uACC4\uD558\uB294 \uCCAB \uB2E8\uACC4"}
            </h1>
            <p className="editorial-copy mt-4 max-w-2xl text-sm">
              {
                "\uC81C\uBAA9, \uCEE4\uBC84, \uBCF8\uBB38 \uC774\uBBF8\uC9C0, \uD310\uD615, \uD15C\uD50C\uB9BF\uC744 \uBA3C\uC800 \uC815\uB9AC\uD55C \uB4A4 AI \uCD08\uC548\uC744 \uC0DD\uC131\uD569\uB2C8\uB2E4. \uC774\uBBF8\uC9C0\uB97C \uC5C5\uB85C\uB4DC\uD558\uC9C0 \uC54A\uC544\uB3C4 \uB370\uBAA8 \uCEE8\uD150\uCE20\uB85C \uBC14\uB85C \uD750\uB984\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
              }
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_0.85fr]">
            <section className="space-y-6">
              <Card className="bg-surface-container-low p-8 shadow-none">
                <div className="space-y-5">
                  <div>
                    <label className="section-label block">
                      {"\uD504\uB85C\uC81D\uD2B8 \uC81C\uBAA9"}
                    </label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-3"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-2xl bg-surface-container-lowest p-5">
                      <p className="section-label">
                        {"\uCEE4\uBC84 \uC774\uBBF8\uC9C0"}
                      </p>
                      <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low px-4 text-center">
                        <span className="display-copy text-3xl italic text-foreground">
                          {"Cover"}
                        </span>
                        <span className="editorial-copy mt-3 text-sm">
                          {
                            "\uD074\uB9AD\uD574 \uD45C\uC9C0 \uC0AC\uC9C4\uC744 \uC120\uD0DD\uD558\uC138\uC694."
                          }
                        </span>
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
                        <p className="section-label">
                          {"\uBCF8\uBB38 \uC774\uBBF8\uC9C0"}
                        </p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary"
                          onClick={() => setContentItems(createDemoContentItems())}
                        >
                          {"\uB370\uBAA8 \uBD88\uB7EC\uC624\uAE30"}
                        </button>
                      </div>
                      <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low px-4 text-center">
                        <span className="display-copy text-3xl italic text-foreground">
                          {"Upload"}
                        </span>
                        <span className="editorial-copy mt-3 text-sm">
                          {
                            "\uC5EC\uB7EC \uC7A5\uC758 \uC7A5\uBA74\uC744 \uD55C \uBC88\uC5D0 \uC120\uD0DD\uD574 \uD750\uB984\uC744 \uB9CC\uB4DC\uC138\uC694."
                          }
                        </span>
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
                <p className="section-label">
                  {"\uD15C\uD50C\uB9BF \uC120\uD0DD"}
                </p>
                <div className="mt-5">
                  <TemplateSelector
                    templates={mockTemplates}
                    selectedTemplateId={selectedTemplateId}
                    onSelect={setSelectedTemplateId}
                  />
                </div>
              </Card>

              <Card className="bg-surface-container-low p-8 shadow-none">
                <p className="section-label">
                  {"\uD310\uD615 \uC120\uD0DD"}
                </p>
                <div className="mt-5">
                  <BookSpecSelector
                    bookSpecs={mockBookSpecs}
                    selectedBookSpecId={selectedBookSpecId}
                    onSelect={setSelectedBookSpecId}
                  />
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isGenerating}
                  className="min-w-52"
                >
                  {isGenerating
                    ? "\uCD08\uC548 \uC0DD\uC131 \uC911..."
                    : "\uC5D0\uB514\uD1A0\uB9AC\uC5BC \uCD08\uC548 \uC0DD\uC131"}
                </Button>
              </div>
            </section>

            <PreviewPanel
              title={title}
              template={selectedTemplate}
              bookSpec={selectedBookSpec}
              coverImageUrl={coverImageUrl}
              imageCount={contentItems.length}
            />
          </div>
        </Container>
      </main>
    </>
  );
}
