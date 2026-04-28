import type { Element, GroupElement, PathElement, ImageElement, VideoElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { ProjectData } from '@/types/project'
import type { RenderedFrame, MediaLayer } from '@/types/export'
import { computeElementAt } from '@/core/animation/engine'
import { rectToSvg, ellipseToSvg, lineToSvg, polygonToSvg, starToSvg, pathToSvg, textToSvg, imageToSvg, groupToSvg } from './svgBuilder'

export interface RenderOptions {
  imageData?: Record<string, string>   // imageStorageId → data URI
}

interface RenderCtx {
  fps:        number
  frameNum:   number
  elementMap: Map<string, Element>
  trackMap:   Map<string, Track[]>
  imageData:  Record<string, string>
  media:      MediaLayer[]
}

function renderElement(id: string, ctx: RenderCtx): string {
  const raw = ctx.elementMap.get(id)
  if (!raw || !raw.visible) return ''
  const el = computeElementAt(raw, ctx.trackMap.get(id) ?? [], ctx.frameNum)

  switch (el.type) {
    case 'rect':    return rectToSvg(el)
    case 'ellipse': return ellipseToSvg(el)
    case 'line':    return lineToSvg(el)
    case 'polygon': return polygonToSvg(el)
    case 'star':    return starToSvg(el)
    case 'path':    return pathToSvg(el as PathElement)
    case 'text':    return textToSvg(el)
    case 'image':   return imageToSvg(el as ImageElement, ctx.imageData[(el as ImageElement).imageStorageId])
    case 'video': {
      const v   = el as VideoElement
      const raw = v.trimStart + (ctx.frameNum / ctx.fps) * v.playbackRate
      ctx.media.push({
        type: 'video', elementId: v.id, blobUrl: '',
        time: Math.max(v.trimStart, Math.min(v.trimEnd, raw)),
        x: v.x, y: v.y, width: v.width, height: v.height,
        rotation: v.rotation, opacity: v.opacity, fit: v.fit,
      })
      return ''
    }
    case 'group': {
      const g = el as GroupElement
      if (g.hasMask) {
        const maskRaw     = g.childIds[0] ? ctx.elementMap.get(g.childIds[0]) ?? null : null
        const maskEl      = maskRaw ? computeElementAt(maskRaw, ctx.trackMap.get(maskRaw.id) ?? [], ctx.frameNum) : null
        const contentSvg  = g.childIds.slice(1).map(cid => renderElement(cid, ctx)).join('')
        return groupToSvg(g, maskEl, contentSvg)
      }
      return groupToSvg(g, null, g.childIds.map(cid => renderElement(cid, ctx)).join(''))
    }
  }
}

/** Pure function: walk the project at a given frame, return an SVG string + media layer descriptors. */
export function renderProjectAtFrame(
  project:  ProjectData,
  frameId:  string,
  frameNum: number,
  options:  RenderOptions = {},
): RenderedFrame {
  const frame = project.frames.find(f => f.id === frameId)
  if (!frame) return { svg: '', media: [], width: 0, height: 0, backgroundColor: '#000000' }

  const elementMap = new Map(project.elements.map(e => [e.id, e]))
  const trackMap   = new Map<string, Track[]>()
  for (const t of project.tracks) {
    const arr = trackMap.get(t.elementId) ?? []
    arr.push(t)
    trackMap.set(t.elementId, arr)
  }

  const media: MediaLayer[] = []
  const ctx: RenderCtx = {
    fps: frame.fps, frameNum, elementMap, trackMap,
    imageData: options.imageData ?? {}, media,
  }

  const bodySvg = frame.elementIds.map(id => renderElement(id, ctx)).join('')
  const bg      = frame.backgroundColor.startsWith('#') ? frame.backgroundColor : `#${frame.backgroundColor}`
  const svg     = `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}"><rect width="${frame.width}" height="${frame.height}" fill="${bg}" />${bodySvg}</svg>`

  return { svg, media, width: frame.width, height: frame.height, backgroundColor: bg }
}
