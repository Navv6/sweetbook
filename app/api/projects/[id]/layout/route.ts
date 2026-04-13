import { NextResponse } from "next/server";

import { reorderProjectSections } from "@/lib/api";
import { saveProject } from "@/lib/project-repository";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
      sectionOrder: string[];
    };
    const project = reorderProjectSections(body.project, body.sectionOrder);
    await saveProject(project);

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to reorder sections.",
      },
      { status: 500 },
    );
  }
}
