import { NextResponse } from "next/server";

import { publishProject } from "@/lib/api";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
    };
    const publish = await publishProject(body.project);
    const project: Project = {
      ...body.project,
      sweetbookBookUid: publish.sweetbookBookUid,
      status: "published",
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ project, publish }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "책 발행에 실패했습니다.";
    console.error("[publish] error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
