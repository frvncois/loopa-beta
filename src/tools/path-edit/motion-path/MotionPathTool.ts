import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useToolStore } from '@/stores/useToolStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useMotionPathState } from '@/composables/useMotionPathState'
import { useMotionPathConfirm } from '@/composables/useMotionPathConfirm'
import type { DrawPoint } from '@/composables/useMotionPathState'
import { buildSvgPath } from '@/core/path/builder'
import { createDefaultElement } from '@/core/elements/factory'
import { generateId } from '@/core/utils/id'
import { distance } from '@/core/utils/math'
import { registerTool } from '../../_base/registry'
import type { ToolController, CanvasContext } from '../../_base/types'
import type { PathPoint, PathElement } from '@/types/element'

// ── Constants ────────────────────────────────────────────────────────────────

const CLOSE_DIST   = 10   // px to first point → close path
const MIN_DRAG     = 4    // px of drag to produce bezier handles
const DBL_CLICK_MS = 300  // ms window for double-click

// ── Module-level state ────────────────────────────────────────────────────────

let isDragging     = false
let dragStart:     { x: number; y: number } | null = null
let lastClickTime  = 0
let lastClickPos:  { x: number; y: number } | null = null
let savedFrameId   = ''

const mpState = useMotionPathState()

// ── Helpers ───────────────────────────────────────────────────────────────────

function commitPath(closed: boolean, ctx: CanvasContext): void {
  const pts = mpState.state.value.points
  if (pts.length < 2) { cancelAll(); return }

  const rawFollower = mpState.state.value.followerElementId
  if (!rawFollower) { cancelAll(); return }
  const followerElementId: string = rawFollower

  // Compute bounding box (include bezier handles)
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

  // Normalize to local (element-relative) coords
  const localPts: PathPoint[] = pts.map((p) => ({
    id:        generateId('pt'),
    x:         p.x - bx,
    y:         p.y - by,
    handleIn:  p.handleIn  ? { x: p.handleIn.x  - bx, y: p.handleIn.y  - by } : null,
    handleOut: p.handleOut ? { x: p.handleOut.x - bx, y: p.handleOut.y - by } : null,
    type:      (p.handleIn || p.handleOut) ? 'smooth' : 'corner',
  }))

  const doc = useDocumentStore()
  const tl  = useTimelineStore()

  const pathEl: PathElement = {
    ...createDefaultElement('path'),
    x: bx, y: by, width: bw, height: bh,
    points: localPts,
    closed,
    d: buildSvgPath(localPts, closed),
    isMotionPath: true,
    name: 'Motion Path',
    fills: [],
    strokes: [],
  }

  const mpId = generateId('mp')

  function doCreate(): void {
    const history  = useHistoryStore()
    const selection = useSelectionStore()
    history.transact('Add Motion Path', () => {
      doc.addElement(pathEl, ctx.frameId)
      doc.addMotionPath({
        id: mpId,
        elementId: followerElementId,
        pathElementId: pathEl.id,
        startFrame: 0,
        endFrame: tl.totalFrames,
        loop: false,
        rotateAlongPath: false,
      })
      selection.select(followerElementId)
    })
    useToolStore().setTool('select')
    mpState.reset()
    resetDragState()
  }

  // Check for existing x/y/rotation keyframe tracks on the follower
  const hasPositionTracks = doc.tracks.some(
    (t) =>
      t.elementId === followerElementId &&
      (t.property === 'x' || t.property === 'y' || t.property === 'rotation') &&
      t.keyframes.length > 0,
  )

  if (hasPositionTracks) {
    useMotionPathConfirm().requestConfirm(doCreate, cancelAll)
    return
  }

  doCreate()
}

function cancelAll(): void {
  mpState.reset()
  resetDragState()
  useToolStore().setTool('select')
}

function resetDragState(): void {
  isDragging    = false
  dragStart     = null
  lastClickTime = 0
  lastClickPos  = null
}

// ── Tool controller ───────────────────────────────────────────────────────────

const MotionPathTool: ToolController = {
  onActivate() {
    mpState.setPhase('picking')
  },

  onDeactivate() {
    mpState.reset()
    resetDragState()
  },

  onPointerDown(e, ctx) {
    const phase = mpState.state.value.phase

    // Phase 1: pick the follower element
    if (phase === 'picking') {
      const elementEl = (e.target as SVGElement).closest('[data-element-id]')
      const elementId = elementEl?.getAttribute('data-element-id') ?? null
      if (!elementId) return

      const doc = useDocumentStore()
      const el  = doc.elementById(elementId)
      if (!el) return
      // Groups and other motion-path elements can't be followers
      if (el.type === 'group') return
      if (el.type === 'path' && (el as PathElement).isMotionPath) return

      mpState.setFollower(elementId)
      mpState.setPhase('drawing')
      savedFrameId = ctx.frameId
      return
    }

    // Phase 2: pen-tool style path drawing
    if (phase === 'drawing') {
      const pos = ctx.screenToSvg(e.clientX, e.clientY)
      savedFrameId = ctx.frameId
      const now = Date.now()
      const pts = mpState.state.value.points

      // Double-click: finalize as open path (trim duplicate last point)
      if (
        lastClickTime > 0 &&
        now - lastClickTime < DBL_CLICK_MS &&
        lastClickPos &&
        distance(pos.x, pos.y, lastClickPos.x, lastClickPos.y) < 8
      ) {
        const trimmed = pts.slice(0, -1)
        mpState.setPoints(trimmed)
        if (trimmed.length >= 2) commitPath(false, ctx)
        else cancelAll()
        return
      }

      // Click near first point (≥2 pts): close the path
      const first = pts[0]
      if (first && pts.length >= 2 && distance(pos.x, pos.y, first.x, first.y) < CLOSE_DIST) {
        commitPath(true, ctx)
        lastClickTime = 0
        lastClickPos  = null
        return
      }

      // Add new anchor
      isDragging = true
      dragStart  = { ...pos }

      const newPt: DrawPoint = { x: pos.x, y: pos.y, handleIn: null, handleOut: null }
      mpState.setPoints([...pts, newPt])

      lastClickTime = now
      lastClickPos  = { ...pos }

      ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    }
  },

  onPointerMove(e, ctx) {
    const pos = ctx.screenToSvg(e.clientX, e.clientY)
    mpState.setCursor(pos)

    if (mpState.state.value.phase !== 'drawing' || !isDragging || !dragStart) return
    if (distance(pos.x, pos.y, dragStart.x, dragStart.y) < MIN_DRAG) return

    // Drag → symmetric bezier handles
    const pts  = [...mpState.state.value.points]
    const last = pts[pts.length - 1]
    if (!last) return

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y
    pts[pts.length - 1] = {
      ...last,
      handleOut: { x: last.x + dx, y: last.y + dy },
      handleIn:  { x: last.x - dx, y: last.y - dy },
    }
    mpState.setPoints(pts)
  },

  onPointerUp(e, _ctx) {
    isDragging = false
    dragStart  = null
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  },

  onKeyDown(e, ctx) {
    if (e.key === 'Escape') {
      cancelAll()
      return
    }
    if (e.key === 'Enter' && mpState.state.value.phase === 'drawing') {
      const pts = mpState.state.value.points
      if (pts.length >= 2) commitPath(false, { ...ctx, frameId: savedFrameId })
      else cancelAll()
    }
  },
}

registerTool('motion-path', MotionPathTool)
