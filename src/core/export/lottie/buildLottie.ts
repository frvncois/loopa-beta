import type { Element, GroupElement, PathElement, ImageElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { ProjectData } from '@/types/project'
import type { Frame } from '@/types/frame'
import type { LottieLayer, LottieAsset } from './types'
import { buildTransform } from './tracks'
import { buildRect }    from './elements/rect'
import { buildEllipse } from './elements/ellipse'
import { buildLine }    from './elements/line'
import { buildPolygon } from './elements/polygon'
import { buildStar }    from './elements/star'
import { buildPath }    from './elements/path'
import { buildText }    from './elements/text'
import { buildImage }   from './elements/image'
import { buildGroup }   from './elements/group'

export interface LottieInput {
  project: ProjectData
  frame: Frame
  imageData: Record<string, string>   // imageStorageId → data URI
}

interface BuildCtx {
  elementMap:    Map<string, Element>
  trackMap:      Map<string, Track[]>
  motionPathMap: Map<string, MotionPath>
  imageData:     Record<string, string>
  assets:        LottieAsset[]
  frame:         Frame
  ind:           number
}

function nextInd(ctx: BuildCtx): number { return ctx.ind++ }

function tracksFor(ctx: BuildCtx, id: string): Track[] {
  return ctx.trackMap.get(id) ?? []
}

function elementToLayer(el: Element, ctx: BuildCtx): LottieLayer | null {
  if (!el.visible) return null
  const tracks  = tracksFor(ctx, el.id)
  const mp      = ctx.motionPathMap.get(el.id) ?? null
  const pathEl  = mp ? (ctx.elementMap.get(mp.pathElementId) as PathElement | undefined) ?? null : null
  const tf      = ctx.frame.totalFrames
  const ind     = nextInd(ctx)

  let layer: LottieLayer | null = null

  switch (el.type) {
    case 'rect':    layer = { ...buildRect(el,    tracks, tf, mp, pathEl), ind }; break
    case 'ellipse': layer = { ...buildEllipse(el, tracks, tf, mp, pathEl), ind }; break
    case 'line':    layer = { ...buildLine(el,    tracks, tf, mp, pathEl), ind }; break
    case 'polygon': layer = { ...buildPolygon(el, tracks, tf, mp, pathEl), ind }; break
    case 'star':    layer = { ...buildStar(el,    tracks, tf, mp, pathEl), ind }; break
    case 'path':
      if (!(el as PathElement).isMotionPath)
        layer = { ...buildPath(el as PathElement, tracks, tf, mp, pathEl), ind }
      break
    case 'text':    layer = { ...buildText(el, tracks, tf), ind } as LottieLayer; break
    case 'image':   layer = { ...buildImage(el as ImageElement, tracks, tf, ctx.imageData, ctx.assets as never), ind } as LottieLayer; break
    case 'group': {
      const grpCtx = {
        elementMap: ctx.elementMap,
        assets: ctx.assets,
        frameWidth:  ctx.frame.width,
        frameHeight: ctx.frame.height,
        buildChild: (child: Element, ci: number) => {
          const childLayer = elementToLayer(child, ctx)
          return childLayer ? { ...childLayer, ind: ci } as LottieLayer : null
        },
      }
      layer = { ...buildGroup(el as GroupElement, tracks, tf, grpCtx), ind }
      break
    }
    case 'video': break   // skipped — preflight warns
  }

  return layer
}

/** Build a Lottie JSON object for one frame of the project. */
export function buildLottie(input: LottieInput): Record<string, unknown> {
  const { project, frame, imageData } = input

  const elementMap = new Map(project.elements.map(e => [e.id, e]))
  const trackMap   = new Map<string, Track[]>()
  for (const t of project.tracks) {
    const arr = trackMap.get(t.elementId) ?? []
    arr.push(t)
    trackMap.set(t.elementId, arr)
  }
  const motionPathMap = new Map(project.motionPaths.map(m => [m.elementId, m]))

  const assets: LottieAsset[] = []
  const ctx: BuildCtx = {
    elementMap, trackMap, motionPathMap, imageData, assets, frame, ind: 0,
  }

  // Top-level elements in reverse → Lottie layers (index 0 = topmost)
  const topLevelIds = frame.elementIds
  const layers: LottieLayer[] = []

  for (let i = topLevelIds.length - 1; i >= 0; i--) {
    const el = elementMap.get(topLevelIds[i]!)
    if (!el || !el.visible) continue
    const layer = elementToLayer(el, ctx)
    if (layer) layers.push(layer)
  }

  return {
    v: '5.7.0',
    fr: frame.fps,
    ip: 0,
    op: frame.totalFrames,
    w:  frame.width,
    h:  frame.height,
    nm: project.meta.name,
    ddd: 0,
    assets,
    layers,
    meta: { g: 'Loopa' },
  }
}
