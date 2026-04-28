import type { PathPoint } from '@/types/element'
import { generateId } from '@/core/utils/id'

interface Coords { x: number; y: number }

function pt(x: number, y: number, handleIn?: Coords | null, handleOut?: Coords | null): PathPoint {
  return {
    id: generateId('pt'),
    x,
    y,
    handleIn: handleIn ?? null,
    handleOut: handleOut ?? null,
    type: 'corner',
  }
}

/**
 * Parse an SVG path 'd' attribute into an array of PathPoints.
 * Supports: M/m, L/l, H/h, V/v, C/c, S/s, Q/q, Z/z
 * Arc (A/a) commands are approximated as line-tos.
 */
export function parseSvgPath(d: string): PathPoint[] {
  if (!d || d.trim() === '') return []

  const points: PathPoint[] = []
  const cmdRe = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g

  let curX = 0
  let curY = 0
  let startX = 0
  let startY = 0
  let lastCtrlX: number | null = null
  let lastCtrlY: number | null = null
  let match: RegExpExecArray | null

  while ((match = cmdRe.exec(d)) !== null) {
    const cmd = match[1]
    const rawArgs = match[2]
    if (cmd === undefined || rawArgs === undefined) continue

    const isRel = cmd === cmd.toLowerCase() && cmd.toUpperCase() !== 'Z'
    const up = cmd.toUpperCase()
    const nums = rawArgs.trim() === ''
      ? []
      : rawArgs.trim().split(/[\s,]+/).filter(Boolean).map(Number)

    const rx = (n: number) => isRel ? curX + n : n
    const ry = (n: number) => isRel ? curY + n : n

    switch (up) {
      case 'M': {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = rx(nums[i] ?? 0)
          const y = ry(nums[i + 1] ?? 0)
          if (i === 0) { startX = x; startY = y }
          points.push(pt(x, y))
          curX = x; curY = y
        }
        lastCtrlX = null; lastCtrlY = null
        break
      }
      case 'L': {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = rx(nums[i] ?? 0)
          const y = ry(nums[i + 1] ?? 0)
          points.push(pt(x, y))
          curX = x; curY = y
        }
        lastCtrlX = null; lastCtrlY = null
        break
      }
      case 'H': {
        for (let i = 0; i < nums.length; i++) {
          const x = isRel ? curX + (nums[i] ?? 0) : (nums[i] ?? 0)
          points.push(pt(x, curY))
          curX = x
        }
        lastCtrlX = null; lastCtrlY = null
        break
      }
      case 'V': {
        for (let i = 0; i < nums.length; i++) {
          const y = isRel ? curY + (nums[i] ?? 0) : (nums[i] ?? 0)
          points.push(pt(curX, y))
          curY = y
        }
        lastCtrlX = null; lastCtrlY = null
        break
      }
      case 'C': {
        for (let i = 0; i + 5 < nums.length; i += 6) {
          const x1 = rx(nums[i] ?? 0)
          const y1 = ry(nums[i + 1] ?? 0)
          const x2 = rx(nums[i + 2] ?? 0)
          const y2 = ry(nums[i + 3] ?? 0)
          const x = rx(nums[i + 4] ?? 0)
          const y = ry(nums[i + 5] ?? 0)
          const prevPt = points[points.length - 1]
          if (prevPt !== undefined) prevPt.handleOut = { x: x1, y: y1 }
          points.push(pt(x, y, { x: x2, y: y2 }, null))
          lastCtrlX = x2; lastCtrlY = y2
          curX = x; curY = y
        }
        break
      }
      case 'S': {
        for (let i = 0; i + 3 < nums.length; i += 4) {
          const x2 = rx(nums[i] ?? 0)
          const y2 = ry(nums[i + 1] ?? 0)
          const x = rx(nums[i + 2] ?? 0)
          const y = ry(nums[i + 3] ?? 0)
          const x1 = lastCtrlX !== null ? 2 * curX - lastCtrlX : curX
          const y1 = lastCtrlY !== null ? 2 * curY - lastCtrlY : curY
          const prevPt = points[points.length - 1]
          if (prevPt !== undefined) prevPt.handleOut = { x: x1, y: y1 }
          points.push(pt(x, y, { x: x2, y: y2 }, null))
          lastCtrlX = x2; lastCtrlY = y2
          curX = x; curY = y
        }
        break
      }
      case 'Q': {
        for (let i = 0; i + 3 < nums.length; i += 4) {
          const qx = rx(nums[i] ?? 0)
          const qy = ry(nums[i + 1] ?? 0)
          const x = rx(nums[i + 2] ?? 0)
          const y = ry(nums[i + 3] ?? 0)
          // Convert quadratic to cubic
          const cp1x = curX + (2 / 3) * (qx - curX)
          const cp1y = curY + (2 / 3) * (qy - curY)
          const cp2x = x + (2 / 3) * (qx - x)
          const cp2y = y + (2 / 3) * (qy - y)
          const prevPt = points[points.length - 1]
          if (prevPt !== undefined) prevPt.handleOut = { x: cp1x, y: cp1y }
          points.push(pt(x, y, { x: cp2x, y: cp2y }, null))
          lastCtrlX = qx; lastCtrlY = qy
          curX = x; curY = y
        }
        break
      }
      case 'T': {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = rx(nums[i] ?? 0)
          const y = ry(nums[i + 1] ?? 0)
          // Smooth quadratic: reflected control point
          const qx: number = lastCtrlX !== null ? 2 * curX - lastCtrlX : curX
          const qy: number = lastCtrlY !== null ? 2 * curY - lastCtrlY : curY
          const cp1x = curX + (2 / 3) * (qx - curX)
          const cp1y = curY + (2 / 3) * (qy - curY)
          const cp2x = x + (2 / 3) * (qx - x)
          const cp2y = y + (2 / 3) * (qy - y)
          const prevPt = points[points.length - 1]
          if (prevPt !== undefined) prevPt.handleOut = { x: cp1x, y: cp1y }
          points.push(pt(x, y, { x: cp2x, y: cp2y }, null))
          lastCtrlX = qx; lastCtrlY = qy
          curX = x; curY = y
        }
        break
      }
      case 'A': {
        // Approximate arc as a straight line to the endpoint
        for (let i = 0; i + 6 < nums.length; i += 7) {
          const x = rx(nums[i + 5] ?? 0)
          const y = ry(nums[i + 6] ?? 0)
          points.push(pt(x, y))
          curX = x; curY = y
        }
        lastCtrlX = null; lastCtrlY = null
        break
      }
      case 'Z': {
        curX = startX; curY = startY
        lastCtrlX = null; lastCtrlY = null
        break
      }
    }
  }

  return points
}
