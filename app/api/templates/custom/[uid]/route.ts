import { NextResponse } from "next/server";

import { getCustomTemplateSchema } from "@/lib/api";

export async function GET(
  _req: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await context.params;
    const schema = await getCustomTemplateSchema(uid);
    return NextResponse.json({ schema });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load template schema" },
      { status: 500 },
    );
  }
}
