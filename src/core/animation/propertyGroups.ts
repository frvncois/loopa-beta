export const GROUP_ORDER = ['Transform', 'Opacity', 'Fill', 'Stroke', 'Shadow', 'Blur', 'Text', 'Other'] as const

export type PropertyGroup = (typeof GROUP_ORDER)[number]

const TRANSFORM_PROPS = new Set(['x', 'y', 'width', 'height', 'rotation', 'scaleX', 'scaleY'])
const OPACITY_PROPS   = new Set(['opacity', 'blendMode'])
const BLUR_PROPS      = new Set(['blur'])
const TEXT_PROPS      = new Set(['fontSize', 'letterSpacing', 'lineHeight', 'fontFamily', 'fontWeight', 'textAlign'])

export function getPropertyGroup(property: string): PropertyGroup {
  if (TRANSFORM_PROPS.has(property)) return 'Transform'
  if (OPACITY_PROPS.has(property))   return 'Opacity'
  if (property.startsWith('fills.'))   return 'Fill'
  if (property.startsWith('strokes.')) return 'Stroke'
  if (property.startsWith('shadows.')) return 'Shadow'
  if (BLUR_PROPS.has(property))      return 'Blur'
  if (TEXT_PROPS.has(property))      return 'Text'
  return 'Other'
}
