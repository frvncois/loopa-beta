import type { ProjectData } from '@/types/project'
import { renderProjectAtFrame } from '@/core/export/render/renderProjectAtFrame'
import { composeFrame } from './composeFrame'

export interface RenderJobOptions {
  scale:      number
  imageData?: Record<string, string>   // imageStorageId → data URI
}

/**
 * Async generator: renders each frame of the given document frame in order,
 * yielding a composited ImageBitmap per frame.
 * The caller is responsible for calling bitmap.close() after use.
 */
export async function* runRenderJob(
  project:    ProjectData,
  artboardId: string,
  options:    RenderJobOptions,
): AsyncGenerator<{ index: number; total: number; bitmap: ImageBitmap }> {
  const artboard = project.artboards.find(a => a.id === artboardId)
  if (!artboard) return

  const total     = artboard.totalFrames
  const imageData = options.imageData ?? {}

  for (let i = 0; i < total; i++) {
    const rendered = renderProjectAtFrame(project, artboardId, i, { imageData })
    const bitmap   = await composeFrame(rendered, options.scale)
    yield { index: i, total, bitmap }
  }
}
