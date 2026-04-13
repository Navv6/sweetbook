import { NextResponse } from "next/server";

import { generateProjectSections } from "@/lib/api";
import { saveProject } from "@/lib/project-repository";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
    };
    const project = await generateProjectSections(body.project);
    await saveProject(project);

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to generate template pages.",
      },
      { status: 500 },
    );
  }
}
