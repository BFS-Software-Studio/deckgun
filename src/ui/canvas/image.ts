// Downscale a data-URL image so the embedded base64 stays small (the workspace
// is one JSON blob), and report the resulting pixel dimensions. Keeps PNG for
// screenshots (lossless) and uses JPEG for photos.
export function prepareImage(
  dataUrl: string,
  maxDim = 1600,
): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      if (scale >= 1) {
        resolve({ src: dataUrl, width, height });
        return;
      }
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ src: dataUrl, width, height });
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const isJpeg = /^data:image\/jpe?g/i.test(dataUrl);
      const out = canvas.toDataURL(
        isJpeg ? "image/jpeg" : "image/png",
        isJpeg ? 0.85 : undefined,
      );
      resolve({
        src: out.length < dataUrl.length ? out : dataUrl,
        width: w,
        height: h,
      });
    };
    img.onerror = () => resolve({ src: dataUrl, width: 240, height: 180 });
    img.src = dataUrl;
  });
}
