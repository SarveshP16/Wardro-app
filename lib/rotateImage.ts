/// Client-side rotation for the add-item preview step — lets you fix a
/// cutout that came out sideways (e.g. a photo taken in landscape) before
/// saving it, without another round-trip through the rembg sidecar
/// (rotating a PNG is a pure pixel transform; the background stays cut
/// out exactly as it was).
export function rotateBase64Png(
  base64: string,
  degrees: 90 | 180 | 270,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const swap = degrees === 90 || degrees === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swap ? img.height : img.width;
      canvas.height = swap ? img.width : img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas isn't supported in this browser."));
        return;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotated = canvas.toDataURL("image/png").split(",")[1];
      if (!rotated) {
        reject(new Error("Could not rotate this image."));
        return;
      }
      resolve(rotated);
    };
    img.onerror = () => reject(new Error("Could not load this image."));
    img.src = `data:image/png;base64,${base64}`;
  });
}
