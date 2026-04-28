import type { Point } from '@/types/geometry'
import { degToRad } from '@/core/utils/math'

export function rotatePoint(point: Point, origin: Point, angleDeg: number): Point {
  const rad = degToRad(angleDeg)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

export function scalePoint(point: Point, origin: Point, sx: number, sy: number): Point {
  return {
    x: origin.x + (point.x - origin.x) * sx,
    y: origin.y + (point.y - origin.y) * sy,
  }
}

/** Convert element transform origin (normalized 0..1) to absolute canvas coordinates. */
export function resolveTransformOrigin(
  x: number,
  y: number,
  width: number,
  height: number,
  origin: { x: number; y: number },
): Point {
  return { x: x + origin.x * width, y: y + origin.y * height }
}
