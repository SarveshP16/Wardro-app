import { BackgroundRemovalError } from "./types";

/// Calls the `rembg` sidecar (see services/rembg/) over the internal
/// Docker network. Server-side only — the client never talks to this
/// service directly. Replaces `background_removal_service.dart`'s
/// on-device ONNX call.
export async function removeBackground(
  bytes: Buffer,
  filename = "photo.jpg",
): Promise<Buffer> {
  const baseUrl = process.env.REMBG_URL ?? "http://rembg:8000";

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(bytes)]), filename);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/remove-bg`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new BackgroundRemovalError(
      "Could not reach the background-removal service.",
    );
  }

  if (!response.ok) {
    throw new BackgroundRemovalError(
      "Could not remove the background from this photo.",
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
