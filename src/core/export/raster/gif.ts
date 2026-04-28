// gifenc is used instead of gif.js because gif.js spawns sub-workers,
// which complicates usage from inside a Web Worker. gifenc is pure JS,
// works anywhere, and produces equivalent output.
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { runRenderJob } from './renderJob'

type Frames   = ReturnType<typeof runRenderJob>
type Progress = (current: number, total: number) => void

const QUALITY_COLORS: Record<string, number> = { low: 64, medium: 128, high: 256 }

/**
 * Consume a frame iterator and encode a GIF.
 * Color depth scales with quality: low=64 colors, medium=128, high=256.
 */
export async function buildGif(
  frames:     Frames,
  fps:        number,
  quality:    'low' | 'medium' | 'high',
  onProgress: Progress,
): Promise<Blob> {
  const delay    = Math.round(100 / fps)   // GIF delay unit is 1/100s (centiseconds)
  const maxColor = QUALITY_COLORS[quality] ?? 128
  const enc      = GIFEncoder()

  for await (const { index, total, bitmap } of frames) {
    const w      = bitmap.width
    const h      = bitmap.height
    const canvas = new OffscreenCanvas(w, h)
    const ctx    = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const { data } = ctx.getImageData(0, 0, w, h)
    const palette  = quantize(data, maxColor, { colorSpace: 'rgb' })
    const indices  = applyPalette(data, palette)

    enc.writeFrame(indices, w, h, { palette, delay, repeat: 0 })
    onProgress(index + 1, total)
  }

  enc.finish()
  const bytes = enc.bytesView()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' })
}
