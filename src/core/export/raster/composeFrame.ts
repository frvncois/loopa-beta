import type { RenderedFrame } from '@/types/export'

/**
 * Rasterise a RenderedFrame to an ImageBitmap at the requested scale.
 * Safe to call from a Web Worker (uses createImageBitmap, not Image).
 *
 * NOTE: video MediaLayer composition is intentionally skipped here.
 * TODO: move video frame extraction into this function using VideoFrame (WebCodecs).
 */
export async function composeFrame(rendered: RenderedFrame, scale: number): Promise<ImageBitmap> {
  const w = Math.max(1, Math.round(rendered.width  * scale))
  const h = Math.max(1, Math.round(rendered.height * scale))

  const svgBlob = new Blob([rendered.svg], { type: 'image/svg+xml' })
  const raw     = await createImageBitmap(svgBlob)

  // SVG with explicit width/height decodes at its declared dimensions.
  // If that already matches the target size, return directly.
  if (raw.width === w && raw.height === h) return raw

  // Resize using createImageBitmap from an already-decoded ImageBitmap source.
  // Reliable in workers — avoids OffscreenCanvas + transferToImageBitmap() which
  // throws InvalidStateError in some Chrome versions.
  const scaled = await createImageBitmap(raw, { resizeWidth: w, resizeHeight: h })
  raw.close()
  return scaled
}
