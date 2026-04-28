import type { Element } from '@/types/element'
import type { Bounds } from '@/types/geometry'

export function getBounds(el: Element): Bounds {
  return { x: el.x, y: el.y, width: el.width, height: el.height }
}

export function getMultiBounds(elements: Element[]): Bounds | null {
  if (elements.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of elements) {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.width)
    maxY = Math.max(maxY, el.y + el.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
