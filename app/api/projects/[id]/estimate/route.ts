import { NextResponse } from "next/server";

import { estimateProject } from "@/lib/api";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
      quantity?: number;
    };
    const estimate = await estimateProject(body.project, body.quantity ?? 1);

    return NextResponse.json({ estimate }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "견적 계산에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
