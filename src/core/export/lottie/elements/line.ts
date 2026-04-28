import type { LineElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { PathElement } from '@/types/element'
import type { LottieShapeLayer } from '../types'
import { buildTransform } from '../tracks'
import { buildStrokes, baseShapeLayer } from './shared'

export function buildLine(
  el: LineElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  // Line: x1=x, y1=y, x2=x+width, y2=y  → horizontal, center at (x+w/2, y)
  // In layer space (centered at 0,0): (-w/2, 0) → (w/2, 0)
  const hw = el.width / 2

  const shape: unknown = {
    ty: 'sh',
    nm: 'Line',
    ks: {
      a: 0,
      k: {
        i: [[0, 0], [0, 0]],
        o: [[0, 0], [0, 0]],
        v: [[-hw, 0], [hw, 0]],
        c: false,
      },
    },
  }

  return baseShapeLayer(el, 0, totalFrames, buildTransform(el, tracks, totalFrames, mp, pathEl), [
    shape,
    ...buildStrokes(el, tracks),
  ])
}
