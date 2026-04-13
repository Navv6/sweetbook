import { NextResponse } from "next/server";

import type { Project } from "@/types/project";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // consume params (id available if needed for logging)

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { message: "Soundtrack generation is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { project: Project };
    const { project } = body;

    const firstSectionTitle =
      project.generatedSections[0]?.title ?? "photo essay";

    const prompt = `ambient background music for photo essay book titled '${project.title}' with section '${firstSectionTitle}', soft piano, warm cinematic, nostalgic, gentle`;

    const Replicate = (await import("replicate")).default;
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837ffe9a4",
      {
        input: {
          prompt,
          duration: 15,
        },
      },
    );

    const audioUrl =
      typeof output === "string"
        ? output
        : Array.isArray(output)
          ? (output[0] as string)
          : null;

    return NextResponse.json({ audioUrl }, { status: 200 });
  } catch (error) {
    console.error("musicgen error:", error);
    return NextResponse.json(
      { message: "Failed to generate the soundtrack." },
      { status: 500 },
    );
  }
}
