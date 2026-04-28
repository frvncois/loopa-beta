import type { Element, ElementType } from '@/types/element'

const BASE_PROPERTIES = [
  'x', 'y', 'width', 'height',
  'rotation', 'scaleX', 'scaleY',
  'opacity',
  'blur',
] as const

const TYPE_EXTRA: Partial<Record<ElementType, readonly string[]>> = {
  text: ['fontSize', 'letterSpacing', 'lineHeight'],
}

/**
 * Returns the set of property paths to snapshot for a given element.
 * Includes static base properties plus dynamic indexed paths for
 * fills, strokes, and shadows that currently exist on the element.
 */
export function getSnapshotProperties(el: Element): readonly string[] {
  const base: string[] = [...BASE_PROPERTIES, ...(TYPE_EXTRA[el.type] ?? [])]
  const dynamic: string[] = []

  for (let i = 0; i < el.fills.length; i++) {
    dynamic.push(`fills.${i}.color`, `fills.${i}.opacity`)
  }
  for (let i = 0; i < el.strokes.length; i++) {
    dynamic.push(`strokes.${i}.color`, `strokes.${i}.width`)
  }
  for (let i = 0; i < el.shadows.length; i++) {
    dynamic.push(`shadows.${i}.x`, `shadows.${i}.y`, `shadows.${i}.blur`, `shadows.${i}.color`, `shadows.${i}.opacity`)
  }

  return [...base, ...dynamic]
}
