import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useToolStore } from '@/stores/useToolStore'
import { usePenState, type InProgressPoint } from '@/features/canvas/composables/usePenState'
import { buildSvgPath } from '@/core/path/builder'
import { createDefaultElement } from '@/core/elements/factory'
import { generateId } from '@/core/utils/id'
import { distance } from '@/core/utils/math'
import { registerTool } from '../_base/registry'
import type { ToolController, CanvasContext } from '../_base/types'
import type { PathPoint } from '@/types/element'

// ── Constants ───────────────────────────────────────────────────────────────

const CLOSE_DIST    = 10   // px to first point → close path
const MIN_DRAG      = 4    // px of drag to produce bezier handles
const DBL_CLICK_MS  = 300  // ms window for double-click

// ── Module-level drag/click state ───────────────────────────────────────────

let isDragging     = false
let dragStart:     { x: number; y: number } | null = null
let lastClickTime  = 0
let lastClickPos:  { x: number; y: number } | null = null
let savedFrameId   = ''

const pen = usePenState()

// ── Helpers ─────────────────────────────────────────────────────────────────

function commit(closed: boolean, ctx: CanvasContext): void {
  const pts = pen.state.value.points
  if (pts.length < 2) { cancel(); return }

  // Compute world bounding box (include handles)
  const allX: number[] = []
  const allY: number[] = []
  for (const p of pts) {
    allX.push(p.x, ...(p.handleIn  ? [p.handleIn.x]  : []))
    allY.push(p.y, ...(p.handleIn  ? [p.handleIn.y]  : []))
    allX.push(     ...(p.handleOut ? [p.handleOut.x] : []))
    allY.push(     ...(p.handleOut ? [p.handleOut.y] : []))
  }
  const bx = Math.min(...allX)
  const by = Math.min(...allY)
  const bw = Math.max(Math.max(...allX) - bx, 1)
  const bh = Math.max(Math.max(...allY) - by, 1)

  // Normalize to local (element-relative) space
  const localPts: PathPoint[] = pts.map((p) => ({
    id:        generateId('pt'),
    x:         p.x - bx,
    y:         p.y - by,
    handleIn:  p.handleIn  ? { x: p.handleIn.x  - bx, y: p.handleIn.y  - by } : null,
    handleOut: p.handleOut ? { x: p.handleOut.x - bx, y: p.handleOut.y - by } : null,
    type:      (p.handleIn || p.handleOut) ? 'smooth' : 'corner',
  }))

  const el = createDefaultElement('path')
  Object.assign(el, {
    x: bx, y: by, width: bw, height: bh,
    points: localPts,
    closed,
    d: buildSvgPath(localPts, closed),
  })

  const doc       = useDocumentStore()
  const selection = useSelectionStore()
  const history   = useHistoryStore()

  history.transact('Add path', () => {
    doc.addElement(el, ctx.frameId)
    selection.select(el.id)
  })

  useToolStore().setTool('select')
  cancel()
}

function cancel(): void {
  pen.reset()
  isDragging    = false
  dragStart     = null
  lastClickTime = 0
  lastClickPos  = null
}

// ── Tool controller ─────────────────────────────────────────────────────────

const PenTool: ToolController = {
  onActivate()   { pen.setActive(true) },
  onDeactivate() { cancel() },

  onPointerDown(e, ctx) {
    const pos = ctx.screenToSvg(e.clientX, e.clientY)
    savedFrameId = ctx.frameId

    const now = Date.now()
    const pts = pen.state.value.points

    // Double-click: finalize as open path (the 1st click already added the point → trim it)
    if (
      lastClickTime > 0 &&
      now - lastClickTime < DBL_CLICK_MS &&
      lastClickPos &&
      distance(pos.x, pos.y, lastClickPos.x, lastClickPos.y) < 8
    ) {
      const trimmed = pts.slice(0, -1)
      pen.setPoints(trimmed)
      if (trimmed.length >= 2) commit(false, ctx)
      else cancel()
      return
    }

    // Close path: click near first point (≥2 pts already)
    const first = pts[0]
    if (first && pts.length >= 2 && distance(pos.x, pos.y, first.x, first.y) < CLOSE_DIST) {
      commit(true, ctx)
      lastClickTime = 0
      lastClickPos  = null
      return
    }

    // Start a new point
    isDragging = true
    dragStart  = { ...pos }

    const newPt: InProgressPoint = { x: pos.x, y: pos.y, handleIn: null, handleOut: null }
    pen.setPoints([...pts, newPt])

    lastClickTime = now
    lastClickPos  = { ...pos }

    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
  },

  onPointerMove(e, ctx) {
    const pos = ctx.screenToSvg(e.clientX, e.clientY)
    pen.setCursor(pos)

    if (!isDragging || !dragStart) return
    if (distance(pos.x, pos.y, dragStart.x, dragStart.y) < MIN_DRAG) return

    // Drag → smooth bezier: handleOut = drag position, handleIn = mirror
    const pts  = [...pen.state.value.points]
    const last = pts[pts.length - 1]
    if (!last) return

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y
    pts[pts.length - 1] = {
      ...last,
      handleOut: { x: last.x + dx, y: last.y + dy },
      handleIn:  { x: last.x - dx, y: last.y - dy },
    }
    pen.setPoints(pts)
  },

  onPointerUp(e, _ctx) {
    isDragging = false
    dragStart  = null
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  },

  onKeyDown(e, ctx) {
    if (e.key === 'Escape') {
      cancel()
      useToolStore().setTool('select')
    }
    if (e.key === 'Enter') {
      const pts = pen.state.value.points
      if (pts.length >= 2) commit(false, { ...ctx, frameId: savedFrameId })
      else { cancel(); useToolStore().setTool('select') }
    }
  },
}

registerTool('pen', PenTool)
