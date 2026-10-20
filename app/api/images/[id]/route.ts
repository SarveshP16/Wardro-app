import { NextRequest, NextResponse } from "next/server";

import { readDisplayImage } from "@/lib/imageStore";

/// Serves a wardrobe item's cutout, trimmed to the garment and sized for
/// display (see readDisplayImage). Item ids are random UUIDs that only reach a
/// client through its own profile's item list, so this isn't scoped per
/// profile -- which keeps the long-lived browser cache simple.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  try {
    const bytes = await readDisplayImage(id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
