import { NextRequest, NextResponse } from "next/server";

import { readImage } from "@/lib/imageStore";

/// Serves a wardrobe item's cutout PNG from the image volume. Port of
/// how the Flutter app read straight from `ImageFileStore`'s file path;
/// here the client instead points an <img> at /api/images/<id>.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const bytes = await readImage(id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
