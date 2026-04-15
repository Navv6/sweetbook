import { NextResponse } from "next/server";

import type { Project } from "@/types/project";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // consume params (id available if needed for logging)

  try {
    const body = (await request.json()) as { project: Project };
    const { project } = body;

    if (!project?.id) {
      // project가 없어도 공유 MP3를 반환한다 (QR 외부 접속 대응)
    }

    // Current soundtrack experience uses a shared MP3 asset.
    // Personalized generation remains a later implementation step.
    const audioUrl = "/soundtrack/The_Shutter_s_Pause.mp3";

    return NextResponse.json({ audioUrl }, { status: 200 });
  } catch (error) {
    console.error("soundtrack load error:", error);
    return NextResponse.json(
      { message: "Failed to load the soundtrack." },
      { status: 500 },
    );
  }
}
