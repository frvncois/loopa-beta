import type { StarElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { PathElement } from '@/types/element'
import type { LottieShapeLayer } from '../types'
import { buildTransform } from '../tracks'
import { buildFills, buildStrokes, baseShapeLayer } from './shared'

export function buildStar(
  el: StarElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  const ks = buildTransform(el, tracks, totalFrames, mp, pathEl)
  const outerR = el.width / 2
  const innerR = outerR * el.innerRadius

  // Lottie sr sy=1 = star
  const shape: unknown = {
    ty: 'sr',
    nm: 'Star',
    sy: 1,
    p:  { a: 0, k: [0, 0] },
    pt: { a: 0, k: el.starPoints },
    r:  { a: 0, k: 0 },
    or: { a: 0, k: outerR },
    ir: { a: 0, k: innerR },
    os: { a: 0, k: 0 },
    is: { a: 0, k: 0 },
  }

  return baseShapeLayer(el, 0, totalFrames, ks, [
    shape,
    ...buildFills(el, tracks),
    ...buildStrokes(el, tracks),
  ])
}
