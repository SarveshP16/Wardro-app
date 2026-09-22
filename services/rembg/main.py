"""Wardro's background-removal sidecar.

A tiny stateless FastAPI wrapper around `rembg` (an ONNX-based salient
object segmentation model) — the server-side replacement for the
Flutter app's on-device `image_background_remover` plugin. Called
internally by the Next.js `web` service over the Docker Compose network;
never exposed to the internet directly.

Takes a raw photo, returns a background-removed cutout PNG with alpha.
"""

from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from rembg import new_session, remove

app = FastAPI(title="wardro-rembg")

# Loaded once at startup, reused across requests. The model itself is
# baked into the Docker image at build time (see Dockerfile) so no
# internet access is needed at runtime.
_session = new_session("u2net")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)) -> Response:
    input_bytes = await file.read()
    if not input_bytes:
        raise HTTPException(status_code=400, detail="Empty upload.")

    try:
        output_bytes = remove(input_bytes, session=_session)
    except Exception as exc:  # noqa: BLE001 - surface as a clean 500
        raise HTTPException(
            status_code=500, detail=f"Background removal failed: {exc}"
        ) from exc

    return Response(content=output_bytes, media_type="image/png")
