export type ElementType =
  | 'rect' | 'ellipse' | 'line' | 'polygon' | 'star'
  | 'text' | 'path' | 'group' | 'image' | 'video'

export interface FillEntry {
  id: string
  visible: boolean
  type: 'solid' | 'linear' | 'radial' | 'none'
  color: string        // hex without #
  opacity: number      // 0-1
}

export interface StrokeEntry {
  id: string
  visible: boolean
  color: string
  width: number
  position: 'center' | 'inside' | 'outside'
  cap: 'butt' | 'round' | 'square'
  join: 'miter' | 'round' | 'bevel'
  dashArray: number[]
  dashOffset: number
}

export interface ShadowEntry {
  id: string
  visible: boolean
  color: string
  opacity: number
  x: number
  y: number
  blur: number
  spread: number
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'

export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  blendMode: BlendMode
  fills: FillEntry[]
  strokes: StrokeEntry[]
  shadows: ShadowEntry[]
  blur: number
  visible: boolean
  locked: boolean
  flipX: boolean
  flipY: boolean
  transformOrigin: { x: number; y: number }   // 0..1 normalized, default {0.5, 0.5}
  cropRect?: { x: number; y: number; width: number; height: number } | null
}

export interface RectElement extends BaseElement {
  type: 'rect'
  rx: number
  ry: number
  radiusTopLeft: number
  radiusTopRight: number
  radiusBottomRight: number
  radiusBottomLeft: number
  radiusLinked: boolean
}

export interface EllipseElement extends BaseElement { type: 'ellipse' }
export interface LineElement extends BaseElement { type: 'line' }

export interface PolygonElement extends BaseElement {
  type: 'polygon'
  sides: number
}

export interface StarElement extends BaseElement {
  type: 'star'
  starPoints: number
  innerRadius: number      // 0..1
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'top' | 'middle' | 'bottom'
  lineHeight: number
  letterSpacing: number
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration: 'none' | 'underline' | 'line-through'
}

export interface PathPoint {
  id: string
  x: number
  y: number
  handleIn: { x: number; y: number } | null
  handleOut: { x: number; y: number } | null
  type: 'corner' | 'smooth' | 'symmetric'
}

export interface PathElement extends BaseElement {
  type: 'path'
  points: PathPoint[]
  closed: boolean
  d: string
  fillRule: 'nonzero' | 'evenodd'
  isMotionPath?: boolean
}

export interface GroupElement extends BaseElement {
  type: 'group'
  childIds: string[]
  hasMask?: boolean
}

export interface ImageElement extends BaseElement {
  type: 'image'
  imageStorageId: string       // IndexedDB key
  imageFileName: string
  imageWidth: number
  imageHeight: number
  objectFit: 'contain' | 'cover' | 'fill'
}

export interface VideoElement extends BaseElement {
  type: 'video'
  videoStorageId: string       // IndexedDB key
  fileName: string
  duration: number
  naturalWidth: number
  naturalHeight: number
  trimStart: number
  trimEnd: number
  fit: 'cover' | 'contain' | 'fill'
  playbackRate: number
}

export type Element =
  | RectElement | EllipseElement | LineElement
  | PolygonElement | StarElement | TextElement
  | PathElement | GroupElement | ImageElement | VideoElement
