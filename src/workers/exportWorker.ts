import type { ProjectData } from '@/types/project'
import type { GifOptions, Mp4Options, PngSequenceOptions, WebmOptions } from '@/types/export'
import { runRenderJob } from '@/core/export/raster/renderJob'
import { buildPngSequence } from '@/core/export/raster/png'
import { buildGif } from '@/core/export/raster/gif'
import { buildMp4, buildWebm } from '@/core/export/raster/video'

export interface WorkerInput {
  format:    'png-sequence' | 'gif' | 'mp4' | 'webm'
  project:   ProjectData
  frameId:   string
  options:   PngSequenceOptions | GifOptions | Mp4Options | WebmOptions
  imageData: Record<string, string>   // imageStorageId → data URI, pre-resolved on main thread
}

export type WorkerOutput =
  | { type: 'progress'; current: number; total: number }
  | { type: 'done';     blob: Blob }
  | { type: 'error';    message: string }

addEventListener('message', async (e: MessageEvent<WorkerInput>) => {
  const { format, project, frameId, options, imageData } = e.data

  const frame = project.frames.find(f => f.id === frameId)
  if (!frame) {
    postMessage({ type: 'error', message: 'Frame not found' } satisfies WorkerOutput)
    return
  }

  const onProgress = (current: number, total: number): void => {
    postMessage({ type: 'progress', current, total } satisfies WorkerOutput)
  }

  try {
    const scale  = 'scale' in options ? options.scale : 1
    const width  = Math.round(frame.width  * scale)
    const height = Math.round(frame.height * scale)
    const frames = runRenderJob(project, frameId, { imageData, scale })

    let blob: Blob
    if (format === 'png-sequence') {
      blob = await buildPngSequence(frames, onProgress)
    } else if (format === 'gif') {
      blob = await buildGif(frames, frame.fps, (options as GifOptions).quality, onProgress)
    } else if (format === 'mp4') {
      blob = await buildMp4(frames, frame.fps, width, height, (options as Mp4Options).bitrate, onProgress)
    } else {
      blob = await buildWebm(frames, frame.fps, width, height, (options as WebmOptions).bitrate, onProgress)
    }

    postMessage({ type: 'done', blob } satisfies WorkerOutput)
  } catch (err) {
    postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } satisfies WorkerOutput)
  }
})
