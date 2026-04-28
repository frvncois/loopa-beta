import type { EllipseElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath, } from '@/types/motion-path'
import type { PathElement } from '@/types/element'
import type { LottieShapeLayer } from '../types'
import { buildTransform } from '../tracks'
import { buildFills, buildStrokes, baseShapeLayer } from './shared'

export function buildEllipse(
  el: EllipseElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  const ks = buildTransform(el, tracks, totalFrames, mp, pathEl)

  const shape: unknown = {
    ty: 'el',
    nm: 'Ellipse',
    p: { a: 0, k: [0, 0] },
    s: { a: 0, k: [el.width, el.height] },
  }

  return baseShapeLayer(el, 0, totalFrames, ks, [
    shape,
    ...buildFills(el, tracks),
    ...buildStrokes(el, tracks),
  ])
}
