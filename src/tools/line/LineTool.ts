import { registerTool } from '../_base/registry'
import { makeDrawTool } from '../_base/makeDrawTool'
import type { Element, LineElement } from '@/types/element'

registerTool(
  'line',
  makeDrawTool('line', (el) => {
    const line = el as LineElement
    return {
      strokes: [
        {
          id: 'stroke_default',
          visible: true,
          color: 'ededf0',
          width: 2,
          position: 'center' as const,
          cap: 'round' as const,
          join: 'round' as const,
          dashArray: [],
          dashOffset: 0,
        },
      ],
      fills: [],
    } satisfies Partial<Element>
  }),
)
