import type { PathPoint } from '@/types/element'

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString()
}

/**
 * Build an SVG path 'd' attribute string from an array of PathPoints.
 * Handles cubic bezier curves and straight lines.
 */
export function buildSvgPath(points: PathPoint[], closed: boolean): string {
  if (points.length === 0) return ''

  const parts: string[] = []
  const first = points[0]
  if (first === undefined) return ''

  parts.push(`M ${fmt(first.x)} ${fmt(first.y)}`)

  for (let i = 1; i < points.length; i++) {
    const pt = points[i]
    const prev = points[i - 1]
    if (pt === undefined || prev === undefined) continue

    if (prev.handleOut !== null && pt.handleIn !== null) {
      parts.push(
        `C ${fmt(prev.handleOut.x)} ${fmt(prev.handleOut.y)}` +
        ` ${fmt(pt.handleIn.x)} ${fmt(pt.handleIn.y)}` +
        ` ${fmt(pt.x)} ${fmt(pt.y)}`,
      )
    } else if (prev.handleOut !== null) {
      parts.push(
        `Q ${fmt(prev.handleOut.x)} ${fmt(prev.handleOut.y)} ${fmt(pt.x)} ${fmt(pt.y)}`,
      )
    } else if (pt.handleIn !== null) {
      parts.push(
        `Q ${fmt(pt.handleIn.x)} ${fmt(pt.handleIn.y)} ${fmt(pt.x)} ${fmt(pt.y)}`,
      )
    } else {
      parts.push(`L ${fmt(pt.x)} ${fmt(pt.y)}`)
    }
  }

  // Close path: connect last point back to first
  if (closed && points.length > 1) {
    const last = points[points.length - 1]
    if (last !== undefined && first !== undefined) {
      if (last.handleOut !== null && first.handleIn !== null) {
        parts.push(
          `C ${fmt(last.handleOut.x)} ${fmt(last.handleOut.y)}` +
          ` ${fmt(first.handleIn.x)} ${fmt(first.handleIn.y)}` +
          ` ${fmt(first.x)} ${fmt(first.y)}`,
        )
      } else if (last.handleOut !== null) {
        parts.push(`Q ${fmt(last.handleOut.x)} ${fmt(last.handleOut.y)} ${fmt(first.x)} ${fmt(first.y)}`)
      } else if (first.handleIn !== null) {
        parts.push(`Q ${fmt(first.handleIn.x)} ${fmt(first.handleIn.y)} ${fmt(first.x)} ${fmt(first.y)}`)
      }
    }
    parts.push('Z')
  }

  return parts.join(' ')
}
