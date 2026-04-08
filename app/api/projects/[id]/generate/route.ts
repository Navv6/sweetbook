import { NextResponse } from "next/server";

import { generateProjectSections } from "@/lib/api";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
    };
    const project = await generateProjectSections(body.project);

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "레이아웃 생성에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
