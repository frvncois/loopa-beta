import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useMarquee } from '@/features/canvas/composables/useMarquee'
import { getBounds } from '@/core/elements/bounds'
import { registerTool } from '../_base/registry'
import type { ToolController, CanvasContext } from '../_base/types'
import type { Point } from '@/types/geometry'

let marqueeStart: Point | null = null
const marquee = useMarquee()

const SelectTool: ToolController = {
  onPointerDown(e, ctx) {
    const target = (e.target as SVGElement).closest('[data-element-id]')
    const elementId = target?.getAttribute('data-element-id') ?? null
    const selection = useSelectionStore()

    if (elementId) {
      if (e.shiftKey) selection.toggleSelection(elementId)
      else if (!selection.selectedIds.has(elementId)) selection.select(elementId)
      // Drag is handled by SelectionOverlay — do nothing else here
    } else {
      // Clicked empty space — start marquee
      if (!e.shiftKey) selection.clearSelection()
      marqueeStart = ctx.screenToSvg(e.clientX, e.clientY)
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    }
  },

  onPointerMove(e, ctx) {
    if (!marqueeStart) return
    const cur = ctx.screenToSvg(e.clientX, e.clientY)
    marquee.set({
      x: Math.min(marqueeStart.x, cur.x),
      y: Math.min(marqueeStart.y, cur.y),
      width: Math.abs(cur.x - marqueeStart.x),
      height: Math.abs(cur.y - marqueeStart.y),
    })
  },

  onPointerUp(e, ctx) {
    if (!marqueeStart) return
    const cur = ctx.screenToSvg(e.clientX, e.clientY)
    const mx = Math.min(marqueeStart.x, cur.x)
    const my = Math.min(marqueeStart.y, cur.y)
    const mw = Math.abs(cur.x - marqueeStart.x)
    const mh = Math.abs(cur.y - marqueeStart.y)
    marqueeStart = null
    marquee.clear()
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)

    if (mw < 4 && mh < 4) return

    const doc = useDocumentStore()
    const selection = useSelectionStore()
    const frameElements = selection.activeFrameId
      ? doc.elementsForFrame(selection.activeFrameId)
      : []

    const hit = frameElements.filter((el) => {
      const b = getBounds(el)
      return b.x < mx + mw && b.x + b.width > mx && b.y < my + mh && b.y + b.height > my
    })

    if (e.shiftKey) {
      hit.forEach((el) => useSelectionStore().addToSelection(el.id))
    } else {
      useSelectionStore().selectMany(hit.map((el) => el.id))
    }
  },

  onKeyDown(e, _ctx) {
    const selection = useSelectionStore()
    const doc = useDocumentStore()
    const history = useHistoryStore()

    if (e.key === 'Escape') {
      selection.clearSelection()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault()
      const frameId = selection.activeFrameId
      if (!frameId) return
      const ids = doc.elementsForFrame(frameId).map((el) => el.id)
      selection.selectMany(ids)
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault()
      const ids = [...selection.selectedIds]
      if (!ids.length) return
      history.transact('Duplicate', () => {
        const newIds = doc.duplicateElements(ids)
        selection.selectMany(newIds)
      })
    }
  },
}

registerTool('select', SelectTool)
