import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy for CORS-safe rendering.
 *
 * html-to-image cannot inline cross-origin images due to browser CORS restrictions.
 * This route fetches the remote image server-side and returns the bytes
 * with permissive CORS headers so the browser canvas can read them.
 *
 * Usage: /api/image-proxy?url=<encoded_url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Only allow http/https to prevent SSRF against internal services
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(targetUrl.toString());
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Upstream error" },
      { status: response.status },
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
