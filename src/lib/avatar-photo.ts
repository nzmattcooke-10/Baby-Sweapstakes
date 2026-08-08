/**
 * Downscale and centre-crop whatever the phone hands us into a small square
 * JPEG, so what lands in the database is a ~256px thumbnail (tens of KB) rather
 * than a multi-megabyte camera photo. Everything happens on the device; the
 * original file never leaves it.
 *
 * Browser-only — it reaches for `document` and `createImageBitmap`, so it may
 * only be called from client components.
 */
export async function fileToAvatarPhoto(file: File): Promise<string> {
  const SIZE = 256;
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.max(SIZE / bitmap.width, SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(bitmap, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.82);
}
