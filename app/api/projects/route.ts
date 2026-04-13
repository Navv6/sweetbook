import { NextResponse } from "next/server";

import { createProjectDraft } from "@/lib/api";
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

    const project = await createProjectDraft(body);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create the project.",
      },
      { status: 500 },
    );
  }
}
