/** Load and decode one image, so it is ready to paint the moment it is shown. Rejects if it cannot be loaded (callers treat that as "missing"). */
export function loadImage(url: string): Promise<void> {
  const image = new Image();
  image.src = url;
  return image.decode();
}
