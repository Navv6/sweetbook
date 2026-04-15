import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const MAX_SIZE = 12 * 1024 * 1024; // 12 MB per file
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const extensionFromMime = (mime: string) => {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "file field is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { message: `Unsupported mime type: ${file.type}` },
        { status: 415 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: `File too large (max ${MAX_SIZE} bytes)` },
        { status: 413 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extensionFromMime(file.type);
    const filename = `${randomUUID()}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), bytes);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
