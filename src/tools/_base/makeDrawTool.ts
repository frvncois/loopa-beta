import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useToolStore } from '@/stores/useToolStore'
import { useDrawPreview } from '@/features/canvas/composables/useDrawPreview'
import { createDefaultElement } from '@/core/elements/factory'
import type { ElementType, Element } from '@/types/element'
import type { ToolController, CanvasContext } from './types'
import type { Point } from '@/types/geometry'

const MIN_SIZE = 4

/**
 * Creates a draw-by-drag ToolController for simple shape types.
 * @param type   The element type to create
 * @param patch  Optional extra properties to set on the new element
 */
export function makeDrawTool(
  type: ElementType,
  patch?: (el: Element) => Partial<Element>,
): ToolController {
  const preview = useDrawPreview()
  let startPt: Point | null = null

  return {
    onPointerDown(e, ctx) {
      startPt = ctx.screenToSvg(e.clientX, e.clientY)
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
      preview.set({ type, x: startPt.x, y: startPt.y, width: 0, height: 0 })
    },

    onPointerMove(e, ctx) {
      if (!startPt) return
      const cur = ctx.screenToSvg(e.clientX, e.clientY)
      preview.set({
        type,
        x: startPt.x,
        y: startPt.y,
        width: cur.x - startPt.x,
        height: cur.y - startPt.y,
      })
    },

    onPointerUp(e, ctx) {
      if (!startPt) return
      const cur = ctx.screenToSvg(e.clientX, e.clientY)
      preview.clear()
      ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)

      const rawW = cur.x - startPt.x
      const rawH = cur.y - startPt.y
      const x = rawW >= 0 ? startPt.x : cur.x
      const y = rawH >= 0 ? startPt.y : cur.y
      const w = Math.abs(rawW)
      const h = Math.abs(rawH)
      startPt = null

      if (w < MIN_SIZE && h < MIN_SIZE) return

      const doc = useDocumentStore()
      const selection = useSelectionStore()
      const history = useHistoryStore()
      const tool = useToolStore()

      const el = createDefaultElement(type)
      Object.assign(el, { x, y, width: w, height: type === 'line' ? 0 : Math.max(h, MIN_SIZE) })
      if (patch) Object.assign(el, patch(el))

      history.transact(`Add ${type}`, () => {
        doc.addElement(el, ctx.frameId)
        selection.select(el.id)
      })
      tool.setTool('select')
    },
  }
}
