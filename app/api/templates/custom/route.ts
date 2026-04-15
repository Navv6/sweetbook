import { NextResponse } from "next/server";

import { getCustomTemplates, saveCustomTemplateFromPage } from "@/lib/api";
import type { GeneratedPage } from "@/types/project";

export async function GET() {
  try {
    const templates = await getCustomTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load custom templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { page?: GeneratedPage };
    if (!body.page) {
      return NextResponse.json({ message: "page is required" }, { status: 400 });
    }
    const templateUid = await saveCustomTemplateFromPage(body.page);
    return NextResponse.json({ templateUid });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save custom template" },
      { status: 500 },
    );
  }
}
