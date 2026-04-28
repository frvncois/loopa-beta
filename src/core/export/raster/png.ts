import { zipSync } from 'fflate'
import type { runRenderJob } from './renderJob'

type Frames = ReturnType<typeof runRenderJob>
type Progress = (current: number, total: number) => void

/**
 * Consume a frame iterator and produce a ZIP of numbered PNG files.
 * Output filename pattern inside the ZIP: frame-0001.png, frame-0002.png, …
 */
export async function buildPngSequence(frames: Frames, onProgress: Progress): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}

  for await (const { index, total, bitmap } of frames) {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx    = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const blob = await canvas.convertToBlob({ type: 'image/png' })
    const buf  = new Uint8Array(await blob.arrayBuffer())
    const name = `frame-${String(index + 1).padStart(4, '0')}.png`
    files[name] = buf

    onProgress(index + 1, total)
  }

  const zip = zipSync(files)
  return new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' })
}
