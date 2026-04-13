import { NextResponse } from "next/server";

import { createProjectDraft, generateProjectSections } from "@/lib/api";
import { saveProject } from "@/lib/project-repository";
import type { ContentItem } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title: string;
      templateId: string;
      bookSpecId: string;
      coverImageUrl?: string;
      contentItems?: ContentItem[];
    };

    const draft = await createProjectDraft(body);
    const project = await generateProjectSections(draft);
    await saveProject(project);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "프로젝트를 생성하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
