import { NextResponse } from "next/server";

import { publishProject } from "@/lib/api";
import { saveProject } from "@/lib/project-repository";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
    };

    console.log(
      "[publish] bookSpecId:", body.project.bookSpecId,
      "| title:", body.project.title,
      "| sections:", body.project.generatedSections.length,
    );

    const publish = await publishProject(body.project);
    const project: Project = {
      ...body.project,
      sweetbookBookUid: publish.sweetbookBookUid,
      status: "published",
      updatedAt: new Date().toISOString(),
    };
    await saveProject(project);

    console.log("[publish] ok bookUid:", publish.sweetbookBookUid);
    return NextResponse.json({ project, publish }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish the book.";
    console.error("[publish] error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
