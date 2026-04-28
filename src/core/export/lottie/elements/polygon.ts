import type { PolygonElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { PathElement } from '@/types/element'
import type { LottieShapeLayer } from '../types'
import { buildTransform } from '../tracks'
import { buildFills, buildStrokes, baseShapeLayer } from './shared'

export function buildPolygon(
  el: PolygonElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  const ks = buildTransform(el, tracks, totalFrames, mp, pathEl)

  // Lottie sr sy=2 = regular polygon (no inner radius)
  const shape: unknown = {
    ty: 'sr',
    nm: 'Polygon',
    sy: 2,
    p:  { a: 0, k: [0, 0] },
    pt: { a: 0, k: el.sides },
    r:  { a: 0, k: 0 },
    or: { a: 0, k: el.width / 2 },
    os: { a: 0, k: 0 },
  }

  return baseShapeLayer(el, 0, totalFrames, ks, [
    shape,
    ...buildFills(el, tracks),
    ...buildStrokes(el, tracks),
  ])
}
