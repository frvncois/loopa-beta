import type { ProjectData } from '@/types/project'
import type { RectElement } from '@/types/element'

// ── Shared base for rect elements ─────────────────────────────────────────────

const BASE: Omit<RectElement, 'id' | 'name' | 'x' | 'y' | 'width' | 'height' | 'fills'> = {
  type:              'rect',
  rotation:          0,
  scaleX:            1,
  scaleY:            1,
  opacity:           1,
  blendMode:         'normal',
  strokes:           [],
  shadows:           [],
  blur:              0,
  visible:           true,
  locked:            false,
  flipX:             false,
  flipY:             false,
  transformOrigin:   { x: 0.5, y: 0.5 },
  rx:                4,
  ry:                4,
  radiusTopLeft:     4,
  radiusTopRight:    4,
  radiusBottomRight: 4,
  radiusBottomLeft:  4,
  radiusLinked:      true,
}

// ── Elements ──────────────────────────────────────────────────────────────────

const hBar: RectElement = {
  ...BASE,
  id:     'tpl-logo-h',
  name:   'H-bar',
  x:      160,
  y:      196,
  width:  80,
  height: 8,
  fills:  [{ id: 'tpl-logo-h-f', visible: true, type: 'solid', color: 'ededf0', opacity: 1 }],
}

const vBar: RectElement = {
  ...BASE,
  id:     'tpl-logo-v',
  name:   'V-bar',
  x:      196,
  y:      160,
  width:  8,
  height: 80,
  fills:  [{ id: 'tpl-logo-v-f', visible: true, type: 'solid', color: '4353ff', opacity: 1 }],
}

// ── Template data ─────────────────────────────────────────────────────────────

export const animatedLogoData: ProjectData = {
  meta: {
    id:        'tpl-animated-logo',
    name:      'Animated Logo',
    createdAt: 0,
    updatedAt: 0,
    thumbnail: null,
  },
  artboards: [
    {
      id:              'tpl-logo-frame',
      name:            'Artboard 1',
      width:           400,
      height:          400,
      backgroundColor: '#0c0c0f',
      elementIds:      ['tpl-logo-h', 'tpl-logo-v'],
      order:           0,
      fps:             30,
      totalFrames:     60,
      loop:            true,
      direction:       'normal',
      canvasX:         0,
      canvasY:         0,
    },
  ],
  elements: [hBar, vBar],
  tracks: [
    {
      id:        'tpl-logo-trk-h',
      elementId: 'tpl-logo-h',
      property:  'rotation',
      enabled:   true,
      keyframes: [
        { id: 'tpl-logo-kh-0',  frame: 0,  value: 0,   easing: 'linear' },
        { id: 'tpl-logo-kh-60', frame: 60, value: 360, easing: 'linear' },
      ],
    },
    {
      id:        'tpl-logo-trk-v',
      elementId: 'tpl-logo-v',
      property:  'rotation',
      enabled:   true,
      keyframes: [
        { id: 'tpl-logo-kv-0',  frame: 0,  value: 0,    easing: 'linear' },
        { id: 'tpl-logo-kv-60', frame: 60, value: -360, easing: 'linear' },
      ],
    },
  ],
  motionPaths:   [],
  schemaVersion: 3,
}
