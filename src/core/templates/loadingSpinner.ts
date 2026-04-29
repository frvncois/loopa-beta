import type { ProjectData } from '@/types/project'
import type { EllipseElement } from '@/types/element'

// ── Element factory ───────────────────────────────────────────────────────────

function dot(id: string, cx: number, color: string): EllipseElement {
  return {
    type:            'ellipse',
    id,
    name:            id,
    x:               cx - 9,
    y:               191,
    width:           18,
    height:          18,
    rotation:        0,
    scaleX:          1,
    scaleY:          1,
    opacity:         1,
    blendMode:       'normal',
    fills:           [{ id: `${id}-f`, visible: true, type: 'solid', color, opacity: 1 }],
    strokes:         [],
    shadows:         [],
    blur:            0,
    visible:         true,
    locked:          false,
    flipX:           false,
    flipY:           false,
    transformOrigin: { x: 0.5, y: 0.5 },
  }
}

// ── Template data ─────────────────────────────────────────────────────────────

export const loadingSpinnerData: ProjectData = {
  meta: {
    id:        'tpl-loading-spinner',
    name:      'Loading Spinner',
    createdAt: 0,
    updatedAt: 0,
    thumbnail: null,
  },
  artboards: [
    {
      id:              'tpl-sp-frame',
      name:            'Artboard 1',
      width:           400,
      height:          400,
      backgroundColor: '#0c0c0f',
      elementIds:      ['tpl-sp-d1', 'tpl-sp-d2', 'tpl-sp-d3'],
      order:           0,
      fps:             30,
      totalFrames:     30,
      loop:            true,
      direction:       'normal',
      canvasX:         0,
      canvasY:         0,
    },
  ],
  elements: [
    dot('tpl-sp-d1', 170, '4353ff'),
    dot('tpl-sp-d2', 200, 'ededf0'),
    dot('tpl-sp-d3', 230, '4353ff'),
  ],
  tracks: [
    // Dot 1: bounce frames 0-8-15, stays at rest 15-30
    {
      id:        'tpl-sp-trk-d1',
      elementId: 'tpl-sp-d1',
      property:  'y',
      enabled:   true,
      keyframes: [
        { id: 'k-d1-0',  frame: 0,  value: 191, easing: 'ease-out' },
        { id: 'k-d1-8',  frame: 8,  value: 171, easing: 'ease-in' },
        { id: 'k-d1-15', frame: 15, value: 191, easing: 'linear'   },
        { id: 'k-d1-30', frame: 30, value: 191, easing: 'linear'   },
      ],
    },
    // Dot 2: staggered by 5 frames
    {
      id:        'tpl-sp-trk-d2',
      elementId: 'tpl-sp-d2',
      property:  'y',
      enabled:   true,
      keyframes: [
        { id: 'k-d2-0',  frame: 0,  value: 191, easing: 'linear'   },
        { id: 'k-d2-5',  frame: 5,  value: 191, easing: 'ease-out' },
        { id: 'k-d2-13', frame: 13, value: 171, easing: 'ease-in'  },
        { id: 'k-d2-20', frame: 20, value: 191, easing: 'linear'   },
        { id: 'k-d2-30', frame: 30, value: 191, easing: 'linear'   },
      ],
    },
    // Dot 3: staggered by 10 frames
    {
      id:        'tpl-sp-trk-d3',
      elementId: 'tpl-sp-d3',
      property:  'y',
      enabled:   true,
      keyframes: [
        { id: 'k-d3-0',  frame: 0,  value: 191, easing: 'linear'   },
        { id: 'k-d3-10', frame: 10, value: 191, easing: 'ease-out' },
        { id: 'k-d3-18', frame: 18, value: 171, easing: 'ease-in'  },
        { id: 'k-d3-25', frame: 25, value: 191, easing: 'linear'   },
        { id: 'k-d3-30', frame: 30, value: 191, easing: 'linear'   },
      ],
    },
  ],
  motionPaths:   [],
  schemaVersion: 3,
}
