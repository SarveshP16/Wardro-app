import { NextRequest, NextResponse } from "next/server";

import { extractDominantColor } from "@/lib/dominantColor";
import { removeBackground } from "@/lib/rembg";
import { BackgroundRemovalError } from "@/lib/types";
import { MAX_UPLOAD_BYTES } from "@/lib/validate";

/// First step of the add-item flow: takes a raw photo, runs it through
/// the rembg sidecar, computes its dominant color, and hands the cutout
/// back to the client as base64 for the category/name preview step (see
/// components/wardrobe/add/). Nothing is persisted yet -- that happens on
/// POST /api/wardrobe/items once the user confirms.
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the upload. Try again." },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No image provided." },
      { status: 400 },
    );
  }
  if (file.type && !file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "That file isn't a photo." },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That photo is too large (25 MB max)." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const cutout = await removeBackground(bytes);
    const dominantColor = await extractDominantColor(cutout);
    return NextResponse.json({
      cutout: cutout.toString("base64"),
      dominantColor,
    });
  } catch (error) {
    const message =
      error instanceof BackgroundRemovalError
        ? error.message
        : "Could not process this photo. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
