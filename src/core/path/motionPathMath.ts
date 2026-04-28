import type { PathPoint } from '@/types/element'
import type { Point } from '@/types/geometry'
import { radToDeg } from '@/core/utils/math'

export interface MotionPathResult {
  position: Point
  tangentAngle: number
}

interface Segment {
  fromX: number
  fromY: number
  toX: number
  toY: number
  length: number
}

function cubicBezierAt(
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number,
  p3x: number, p3y: number,
  t: number,
): Point {
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

const SAMPLES_PER_SEGMENT = 30

function buildSegments(points: PathPoint[], closed: boolean): Segment[] {
  const segments: Segment[] = []
  const count = closed ? points.length : points.length - 1

  for (let i = 0; i < count; i++) {
    const from = points[i]
    const to = points[(i + 1) % points.length]
    if (from === undefined || to === undefined) continue

    const p0x = from.x
    const p0y = from.y
    const p3x = to.x
    const p3y = to.y
    const p1x = from.handleOut?.x ?? p0x
    const p1y = from.handleOut?.y ?? p0y
    const p2x = to.handleIn?.x ?? p3x
    const p2y = to.handleIn?.y ?? p3y

    let prev = cubicBezierAt(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, 0)
    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const curr = cubicBezierAt(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, s / SAMPLES_PER_SEGMENT)
      const dx = curr.x - prev.x
      const dy = curr.y - prev.y
      const len = Math.sqrt(dx * dx + dy * dy)
      segments.push({ fromX: prev.x, fromY: prev.y, toX: curr.x, toY: curr.y, length: len })
      prev = curr
    }
  }

  return segments
}

/**
 * Compute the position and tangent angle at a given progress (0..1) along the path.
 */
export function pointAtProgress(
  points: PathPoint[],
  closed: boolean,
  progress: number,
): MotionPathResult {
  const clampedProgress = Math.max(0, Math.min(1, progress))

  if (points.length === 0) return { position: { x: 0, y: 0 }, tangentAngle: 0 }

  const first = points[0]
  if (points.length === 1 || first === undefined) {
    return { position: { x: first?.x ?? 0, y: first?.y ?? 0 }, tangentAngle: 0 }
  }

  const segments = buildSegments(points, closed)
  if (segments.length === 0) return { position: { x: first.x, y: first.y }, tangentAngle: 0 }

  const totalLength = segments.reduce((sum, s) => sum + s.length, 0)
  const targetLength = clampedProgress * totalLength

  let accumulated = 0
  for (const seg of segments) {
    const end = accumulated + seg.length
    if (end >= targetLength || seg === segments[segments.length - 1]) {
      const t = seg.length > 0 ? Math.max(0, Math.min(1, (targetLength - accumulated) / seg.length)) : 0
      const position = {
        x: seg.fromX + (seg.toX - seg.fromX) * t,
        y: seg.fromY + (seg.toY - seg.fromY) * t,
      }
      const tangentAngle = radToDeg(Math.atan2(seg.toY - seg.fromY, seg.toX - seg.fromX))
      return { position, tangentAngle }
    }
    accumulated = end
  }

  const lastSeg = segments[segments.length - 1]
  const tangentAngle = lastSeg !== undefined
    ? radToDeg(Math.atan2(lastSeg.toY - lastSeg.fromY, lastSeg.toX - lastSeg.fromX))
    : 0
  return {
    position: { x: lastSeg?.toX ?? 0, y: lastSeg?.toY ?? 0 },
    tangentAngle,
  }
}
