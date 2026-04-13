import { NextResponse } from "next/server";

import { estimateProject } from "@/lib/api";
import type { Project } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
      quantity?: number;
    };

    // Estimate requires a published bookUid. Return empty result if not yet published
    // rather than a 500 — the checkout page handles a null estimate gracefully.
    if (!body.project.sweetbookBookUid || body.project.status !== "published") {
      return NextResponse.json({ estimate: null }, { status: 200 });
    }

    const estimate = await estimateProject(body.project, body.quantity ?? 1);

    return NextResponse.json({ estimate }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to calculate the estimate.",
      },
      { status: 500 },
    );
  }
}
