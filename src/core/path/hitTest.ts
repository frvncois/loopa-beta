import type { PathPoint } from '@/types/element'
import { distance } from '@/core/utils/math'

/** Sample a cubic bezier curve at parameter t. */
function cubicBezierPoint(
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number,
  p3x: number, p3y: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: mt3 * p0x + 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3 * p3x,
    y: mt3 * p0y + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * p3y,
  }
}

const SAMPLES = 20

/**
 * Test whether a point (x, y) lies within `tolerance` pixels of the path
 * defined by the given PathPoints.
 */
export function hitTestPath(
  points: PathPoint[],
  closed: boolean,
  x: number,
  y: number,
  tolerance = 5,
): boolean {
  if (points.length < 2) return false

  const count = closed ? points.length : points.length - 1

  for (let i = 0; i < count; i++) {
    const from = points[i]
    const to = points[(i + 1) % points.length]
    if (from === undefined || to === undefined) continue

    const p0x = from.x
    const p0y = from.y
    const p3x = to.x
    const p3y = to.y

    if (from.handleOut !== null || to.handleIn !== null) {
      const p1x = from.handleOut?.x ?? p0x
      const p1y = from.handleOut?.y ?? p0y
      const p2x = to.handleIn?.x ?? p3x
      const p2y = to.handleIn?.y ?? p3y

      let prev = cubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, 0)
      for (let s = 1; s <= SAMPLES; s++) {
        const curr = cubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, s / SAMPLES)
        const t = 0.5
        const mx = prev.x + (curr.x - prev.x) * t
        const my = prev.y + (curr.y - prev.y) * t
        if (distance(x, y, mx, my) <= tolerance) return true
        prev = curr
      }
    } else {
      // Straight line segment
      const d = distPointToSegment(x, y, p0x, p0y, p3x, p3y)
      if (d <= tolerance) return true
    }
  }

  return false
}

function distPointToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return distance(px, py, ax, ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return distance(px, py, ax + t * dx, ay + t * dy)
}
