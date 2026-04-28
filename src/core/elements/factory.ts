import type {
  Element, ElementType, BaseElement,
  RectElement, EllipseElement, LineElement, PolygonElement, StarElement,
  TextElement, PathElement, GroupElement, ImageElement, VideoElement,
  FillEntry,
} from '@/types/element'
import { generateId } from '@/core/utils/id'

function defaultFill(): FillEntry {
  return {
    id: generateId('fill'),
    visible: true,
    type: 'solid',
    color: 'ededf0',
    opacity: 1,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function makeBase<T extends ElementType>(type: T, name?: string): BaseElement & { type: T } {
  return {
    id: generateId(type),
    type,
    name: name ?? capitalize(type),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    blendMode: 'normal',
    fills: [defaultFill()],
    strokes: [],
    shadows: [],
    blur: 0,
    visible: true,
    locked: false,
    flipX: false,
    flipY: false,
    transformOrigin: { x: 0.5, y: 0.5 },
  }
}

export function createDefaultElement(type: 'rect'): RectElement
export function createDefaultElement(type: 'ellipse'): EllipseElement
export function createDefaultElement(type: 'line'): LineElement
export function createDefaultElement(type: 'polygon'): PolygonElement
export function createDefaultElement(type: 'star'): StarElement
export function createDefaultElement(type: 'text'): TextElement
export function createDefaultElement(type: 'path'): PathElement
export function createDefaultElement(type: 'group'): GroupElement
export function createDefaultElement(type: 'image'): ImageElement
export function createDefaultElement(type: 'video'): VideoElement
export function createDefaultElement(type: ElementType): Element
export function createDefaultElement(type: ElementType): Element {
  switch (type) {
    case 'rect': {
      const el: RectElement = {
        ...makeBase('rect', 'Rectangle'),
        rx: 0,
        ry: 0,
        radiusTopLeft: 0,
        radiusTopRight: 0,
        radiusBottomRight: 0,
        radiusBottomLeft: 0,
        radiusLinked: true,
      }
      return el
    }
    case 'ellipse': {
      const el: EllipseElement = { ...makeBase('ellipse', 'Ellipse') }
      return el
    }
    case 'line': {
      const el: LineElement = {
        ...makeBase('line', 'Line'),
        height: 0,
        fills: [],
      }
      return el
    }
    case 'polygon': {
      const el: PolygonElement = { ...makeBase('polygon', 'Polygon'), sides: 5 }
      return el
    }
    case 'star': {
      const el: StarElement = {
        ...makeBase('star', 'Star'),
        starPoints: 5,
        innerRadius: 0.4,
      }
      return el
    }
    case 'text': {
      const el: TextElement = {
        ...makeBase('text', 'Text'),
        width: 200,
        height: 40,
        text: 'Text',
        fontSize: 16,
        fontFamily: 'DM Sans',
        fontWeight: 400,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.4,
        letterSpacing: 0,
        textTransform: 'none',
        textDecoration: 'none',
      }
      return el
    }
    case 'path': {
      const el: PathElement = {
        ...makeBase('path', 'Path'),
        points: [],
        closed: false,
        d: '',
        fillRule: 'nonzero',
      }
      return el
    }
    case 'group': {
      const el: GroupElement = {
        ...makeBase('group', 'Group'),
        fills: [],
        childIds: [],
      }
      return el
    }
    case 'image': {
      const el: ImageElement = {
        ...makeBase('image', 'Image'),
        fills: [],
        imageStorageId: '',
        imageFileName: '',
        imageWidth: 0,
        imageHeight: 0,
        objectFit: 'cover',
      }
      return el
    }
    case 'video': {
      const el: VideoElement = {
        ...makeBase('video', 'Video'),
        fills: [],
        videoStorageId: '',
        fileName: '',
        duration: 0,
        naturalWidth: 0,
        naturalHeight: 0,
        trimStart: 0,
        trimEnd: 0,
        fit: 'cover',
        playbackRate: 1,
      }
      return el
    }
  }
}
