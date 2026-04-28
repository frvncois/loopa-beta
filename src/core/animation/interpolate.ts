import type { KeyframeValue } from '@/types/track'
import type { PathPoint } from '@/types/element'
import { lerp } from '@/core/utils/math'
import { lerpColor } from '@/core/utils/color'

function isPathPointArray(value: KeyframeValue): value is PathPoint[] {
  return Array.isArray(value)
}

function interpolatePathPoints(from: PathPoint[], to: PathPoint[], t: number): PathPoint[] {
  // Structurally different paths: snap at t=0.5
  if (from.length !== to.length) return t < 0.5 ? from : to

  return from.map((fromPt, i) => {
    const toPt = to[i]
    if (toPt === undefined) return fromPt

    const handleIn = fromPt.handleIn && toPt.handleIn
      ? { x: lerp(fromPt.handleIn.x, toPt.handleIn.x, t), y: lerp(fromPt.handleIn.y, toPt.handleIn.y, t) }
      : t < 0.5 ? fromPt.handleIn : (toPt.handleIn ?? null)

    const handleOut = fromPt.handleOut && toPt.handleOut
      ? { x: lerp(fromPt.handleOut.x, toPt.handleOut.x, t), y: lerp(fromPt.handleOut.y, toPt.handleOut.y, t) }
      : t < 0.5 ? fromPt.handleOut : (toPt.handleOut ?? null)

    return {
      id: fromPt.id,
      x: lerp(fromPt.x, toPt.x, t),
      y: lerp(fromPt.y, toPt.y, t),
      handleIn,
      handleOut,
      type: t < 0.5 ? fromPt.type : toPt.type,
    }
  })
}

/**
 * Interpolate between two keyframe values at progress t (0..1).
 * Uses the property path to determine the interpolation strategy.
 */
export function interpolate(
  from: KeyframeValue,
  to: KeyframeValue,
  t: number,
  property: string,
): KeyframeValue {
  if (property.toLowerCase().includes('color')) {
    return lerpColor(String(from), String(to), t)
  }

  if (property === 'points' && isPathPointArray(from) && isPathPointArray(to)) {
    return interpolatePathPoints(from, to, t)
  }

  // SVG path string: snap at t=0.5 (structural diff)
  if (property === 'd') {
    return t < 0.5 ? from : to
  }

  return lerp(Number(from), Number(to), t)
}
