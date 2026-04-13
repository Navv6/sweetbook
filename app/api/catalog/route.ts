import { NextResponse } from "next/server";

import { getBookSpecOptions, getTemplateCatalog } from "@/lib/api";

export async function GET() {
  try {
    const [catalog, bookSpecs] = await Promise.all([
      getTemplateCatalog(),
      getBookSpecOptions(),
    ]);

    return NextResponse.json(
      {
        templates: catalog.templates,
        templateSummary: catalog.summary,
        message: catalog.message,
        bookSpecs,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load the SweetBook catalog.",
      },
      { status: 500 },
    );
  }
}
