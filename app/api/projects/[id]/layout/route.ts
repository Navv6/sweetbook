import { NextResponse } from "next/server";

import { reorderProjectSections } from "@/lib/api";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
      sectionOrder: string[];
    };
    const project = reorderProjectSections(body.project, body.sectionOrder);

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "섹션 정렬 저장에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
