import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer'
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer'
import type { runRenderJob } from './renderJob'

type Frames   = ReturnType<typeof runRenderJob>
type Progress = (current: number, total: number) => void

// H.264 and VP9 both require even pixel dimensions
function evenDim(n: number): number {
  return n % 2 === 0 ? n : n + 1
}

/**
 * Shared encode pipeline: creates a VideoEncoder, runs the frame loop, and flushes.
 * The caller owns muxer setup, finalization, and blob construction.
 */
async function encodeToMuxer(
  frames:     Frames,
  fps:        number,
  w:          number,
  h:          number,
  bitrate:    number,
  codec:      string,
  addChunk:   (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void,
  onProgress: Progress,
): Promise<void> {
  const usPerFrame = Math.round(1_000_000 / fps)

  let encodeError: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => addChunk(chunk, meta),
    error:  (e) => { encodeError = e },
  })

  encoder.configure({ codec, width: w, height: h, bitrate: bitrate * 1000, framerate: fps })

  for await (const { index, total, bitmap } of frames) {
    if (encodeError) throw encodeError
    const frame = new VideoFrame(bitmap, {
      timestamp: index * usPerFrame,
      duration:  usPerFrame,
    })
    encoder.encode(frame, { keyFrame: index % 30 === 0 })
    frame.close()
    bitmap.close()
    onProgress(index + 1, total)
  }

  await encoder.flush()
  if (encodeError) throw encodeError
}

/**
 * Encode an ImageBitmap frame iterator to MP4 (H.264) using WebCodecs + mp4-muxer.
 * Runs entirely inside a Web Worker.
 */
export async function buildMp4(
  frames:     Frames,
  fps:        number,
  width:      number,
  height:     number,
  bitrate:    number,   // kbps
  onProgress: Progress,
): Promise<Blob> {
  const w = evenDim(width)
  const h = evenDim(height)

  const target = new Mp4Target()
  const muxer  = new Mp4Muxer({
    target,
    video:     { codec: 'avc', width: w, height: h },
    fastStart: 'in-memory',
  })

  await encodeToMuxer(frames, fps, w, h, bitrate, 'avc1.42001f',
    (chunk, meta) => muxer.addVideoChunk(chunk, meta), onProgress)

  muxer.finalize()
  return new Blob([target.buffer], { type: 'video/mp4' })
}

/**
 * Encode an ImageBitmap frame iterator to WebM (VP9) using WebCodecs + webm-muxer.
 * Runs entirely inside a Web Worker.
 */
export async function buildWebm(
  frames:     Frames,
  fps:        number,
  width:      number,
  height:     number,
  bitrate:    number,   // kbps
  onProgress: Progress,
): Promise<Blob> {
  const w = evenDim(width)
  const h = evenDim(height)

  const target = new WebmTarget()
  const muxer  = new WebmMuxer({
    target,
    video: { codec: 'V_VP9', width: w, height: h, frameRate: fps },
  })

  await encodeToMuxer(frames, fps, w, h, bitrate, 'vp09.00.10.08',
    (chunk, meta) => muxer.addVideoChunk(chunk, meta), onProgress)

  muxer.finalize()
  return new Blob([target.buffer], { type: 'video/webm' })
}
