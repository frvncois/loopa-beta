import { useViewportStore } from '@/stores/useViewportStore'
import { useToolStore } from '@/stores/useToolStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useCanvasViewport } from './useCanvasViewport'
import { createToolDispatcher } from '@/tools/_base/ToolDispatcher'
import { getToolController } from '@/tools/_base/registry'
import type { CanvasContext } from '@/tools/_base/types'

const DRAW_TOOLS  = new Set(['rect', 'ellipse', 'line', 'polygon', 'star', 'text', 'pen', 'motion-path'])
const DBL_CLICK_MS = 300
const DBL_CLICK_PX = 8

export function useCanvasInteractions(getFrameId: () => string) {
  const viewport   = useViewportStore()
  const toolStore  = useToolStore()
  const { screenToSvg, onWheelZoom } = useCanvasViewport()
  const dispatcher = createToolDispatcher()

  // Middle-mouse / hand-tool pan state
  let panning      = false
  let panStartX    = 0
  let panStartY    = 0
  let panStartPanX = 0
  let panStartPanY = 0

  // Double-click detection
  let lastDownTime  = 0
  let lastDownX     = 0
  let lastDownY     = 0

  function makeCtx(e: PointerEvent): CanvasContext {
    return { frameId: getFrameId(), screenToSvg: (cx, cy) => screenToSvg(cx, cy) }
  }

  function keyCtx(): CanvasContext {
    return { frameId: getFrameId(), screenToSvg: (cx, cy) => screenToSvg(cx, cy) }
  }

  function isPathEditMode(): boolean {
    return useSelectionStore().pathEditMode
  }

  function isShapeEditMode(): boolean {
    return toolStore.currentTool === 'shape-edit'
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button === 1 || toolStore.currentTool === 'hand') {
      e.preventDefault()
      panning      = true
      panStartX    = e.clientX
      panStartY    = e.clientY
      panStartPanX = viewport.panX
      panStartPanY = viewport.panY
      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
      return
    }

    const now       = Date.now()
    const isDouble  = (
      now - lastDownTime < DBL_CLICK_MS &&
      Math.abs(e.clientX - lastDownX) < DBL_CLICK_PX &&
      Math.abs(e.clientY - lastDownY) < DBL_CLICK_PX
    )
    lastDownTime = now
    lastDownX    = e.clientX
    lastDownY    = e.clientY

    // Path-edit mode: route all events to PathEditTool
    if (isPathEditMode()) {
      getToolController('path-edit')?.onPointerDown?.(e, makeCtx(e))
      return
    }

    // Shape-edit mode: route all events to ShapeEditTool
    if (isShapeEditMode()) {
      getToolController('shape-edit')?.onPointerDown?.(e, makeCtx(e))
      return
    }

    // Double-click on a path/rect while select tool is active → enter edit mode
    if (isDouble && toolStore.currentTool === 'select') {
      const elementEl  = (e.target as SVGElement).closest('[data-element-id]')
      const elementId  = elementEl?.getAttribute('data-element-id') ?? null
      if (elementId) {
        const el = useDocumentStore().elementById(elementId)
        if (el?.type === 'path') {
          useSelectionStore().enterPathEditMode(elementId)
          e.stopPropagation()
          return
        }
        if (el?.type === 'rect' && !el.locked && el.visible) {
          useSelectionStore().select(elementId)
          toolStore.setTool('shape-edit')
          e.stopPropagation()
          return
        }
      }
    }

    dispatcher.dispatch('pointerdown', e, makeCtx(e))
  }

  function onPointerMove(e: PointerEvent): void {
    if (panning) {
      viewport.pan(
        panStartPanX + (e.clientX - panStartX) - viewport.panX,
        panStartPanY + (e.clientY - panStartY) - viewport.panY,
      )
      return
    }
    if (isPathEditMode()) {
      getToolController('path-edit')?.onPointerMove?.(e, makeCtx(e))
      return
    }
    if (isShapeEditMode()) {
      getToolController('shape-edit')?.onPointerMove?.(e, makeCtx(e))
      return
    }
    if (DRAW_TOOLS.has(toolStore.currentTool)) {
      dispatcher.dispatch('pointermove', e, makeCtx(e))
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (panning) {
      panning = false
      ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
      return
    }
    if (isPathEditMode()) {
      getToolController('path-edit')?.onPointerUp?.(e, makeCtx(e))
      return
    }
    if (isShapeEditMode()) {
      getToolController('shape-edit')?.onPointerUp?.(e, makeCtx(e))
      return
    }
    dispatcher.dispatch('pointerup', e, makeCtx(e))
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey || !e.shiftKey) {
      onWheelZoom(e)
    } else {
      viewport.pan(-e.deltaX, -e.deltaY)
    }
  }

  // Dispatches keyboard events to the active tool (pen ESC/Enter, path-edit ESC, etc.)
  function onKeyDown(e: KeyboardEvent): void {
    const ctx = keyCtx()
    if (isPathEditMode()) {
      getToolController('path-edit')?.onKeyDown?.(e, ctx)
      return
    }
    if (isShapeEditMode()) {
      getToolController('shape-edit')?.onKeyDown?.(e, ctx)
      return
    }
    dispatcher.dispatchKeyDown(e, ctx)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onWheel, onKeyDown }
}
