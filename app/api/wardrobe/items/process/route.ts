import { NextRequest, NextResponse } from "next/server";

import { extractDominantColor } from "@/lib/dominantColor";
import { removeBackground } from "@/lib/rembg";
import { BackgroundRemovalError } from "@/lib/types";

/// First step of the add-item flow: takes a raw photo, runs it through
/// the rembg sidecar, computes its dominant color, and hands the cutout
/// back to the client as base64 for the category/name preview step (see
/// add_item_processing_view.dart -> add_item_preview_form.dart in the
/// original app). Nothing is persisted yet -- that happens on
/// POST /api/wardrobe/items once the user confirms.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No image provided." },
      { status: 400 },
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
