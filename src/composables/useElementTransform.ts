import { ref } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCanvasViewport } from '@/features/canvas/composables/useCanvasViewport'
import { computeElementAt } from '@/core/animation/engine'
import { radToDeg } from '@/core/utils/math'
import type { Point } from '@/types/geometry'
import type { Element } from '@/types/element'
import type { PropertyPath } from '@/types/track'

// ── Operation types ────────────────────────────────────────────────────────

interface DragOp {
  type: 'drag'
  startSvg: Point
  startPositions: Map<string, { x: number; y: number }>
}

interface ResizeOp {
  type: 'resize'
  handle: string
  startSvg: Point
  startBounds: { x: number; y: number; width: number; height: number }
  elementId: string
}

interface RotateOp {
  type: 'rotate'
  center: Point
  startAngleDeg: number
  startRotation: number
  elementId: string
}

type ActiveOp = DragOp | ResizeOp | RotateOp

// ── Composable ─────────────────────────────────────────────────────────────

export function useElementTransform() {
  const doc      = useDocumentStore()
  const history  = useHistoryStore()
  const timeline = useTimelineStore()
  const { screenToSvg } = useCanvasViewport()

  const activeOp = ref<ActiveOp | null>(null)

  // Returns the ANIMATED element at the current frame (what the user sees).
  function getAnimated(id: string): Element | null {
    const el = doc.elementById(id)
    if (!el) return null
    return computeElementAt(el, doc.tracksForElement(id), Math.round(timeline.currentFrame))
  }

  // Track-aware property write: updates a keyframe if a track exists, otherwise
  // writes directly to the element. This mirrors useAnimatedProperty's setter.
  function setProp(id: string, prop: PropertyPath, value: number): void {
    const frame = Math.round(timeline.currentFrame)
    if (doc.trackForProperty(id, prop)) {
      doc.upsertKeyframe(id, prop, frame, value)
    } else {
      doc.updateElement(id, { [prop]: value } as Partial<Element>)
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────

  function startDrag(e: PointerEvent, ids: string[]): void {
    e.stopPropagation()
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    const startSvg = screenToSvg(e.clientX, e.clientY)
    // Capture animated positions so dragging starts from what the user sees.
    const startPositions = new Map(
      ids.map((id) => {
        const a = getAnimated(id)
        return [id, { x: a?.x ?? 0, y: a?.y ?? 0 }]
      }),
    )
    history.beginTransaction('Move')
    activeOp.value = { type: 'drag', startSvg, startPositions }
  }

  // ── Resize ────────────────────────────────────────────────────────────

  function startResize(e: PointerEvent, handle: string, elementId: string): void {
    e.stopPropagation()
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    const a = getAnimated(elementId)
    if (!a) return
    const startBounds = { x: a.x, y: a.y, width: a.width, height: a.height }
    history.beginTransaction('Resize')
    activeOp.value = {
      type: 'resize',
      handle,
      startSvg: screenToSvg(e.clientX, e.clientY),
      startBounds,
      elementId,
    }
  }

  // ── Rotate ────────────────────────────────────────────────────────────

  function startRotate(e: PointerEvent, elementId: string): void {
    e.stopPropagation()
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    const a = getAnimated(elementId)
    if (!a) return
    const center: Point = { x: a.x + a.width / 2, y: a.y + a.height / 2 }
    const start = screenToSvg(e.clientX, e.clientY)
    history.beginTransaction('Rotate')
    activeOp.value = {
      type: 'rotate',
      center,
      startAngleDeg: radToDeg(Math.atan2(start.y - center.y, start.x - center.x)),
      startRotation: a.rotation,
      elementId,
    }
  }

  // ── Pointer move ──────────────────────────────────────────────────────

  function onPointerMove(e: PointerEvent): void {
    const op = activeOp.value
    if (!op) return
    const cur = screenToSvg(e.clientX, e.clientY)

    if (op.type === 'drag') {
      const dx = cur.x - op.startSvg.x
      const dy = cur.y - op.startSvg.y
      for (const [id, start] of op.startPositions) {
        setProp(id, 'x', start.x + dx)
        setProp(id, 'y', start.y + dy)
      }
    } else if (op.type === 'resize') {
      applyResize(op, cur, setProp)
    } else if (op.type === 'rotate') {
      const angleDeg = radToDeg(Math.atan2(cur.y - op.center.y, cur.x - op.center.x))
      setProp(op.elementId, 'rotation', op.startRotation + (angleDeg - op.startAngleDeg))
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!activeOp.value) return
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
    activeOp.value = null
    history.commit()
  }

  return { startDrag, startResize, startRotate, onPointerMove, onPointerUp }
}

// ── Resize math ────────────────────────────────────────────────────────────

type SetPropFn = (id: string, prop: PropertyPath, value: number) => void

function applyResize(op: ResizeOp, cur: Point, setProp: SetPropFn): void {
  const b = op.startBounds
  const dx = cur.x - op.startSvg.x
  const dy = cur.y - op.startSvg.y
  const MIN = 4

  let x = b.x, y = b.y, w = b.width, h = b.height

  if (op.handle.includes('e')) w = Math.max(MIN, b.width + dx)
  if (op.handle.includes('s')) h = Math.max(MIN, b.height + dy)
  if (op.handle.includes('w')) { const nw = Math.max(MIN, b.width - dx); x = b.x + b.width - nw; w = nw }
  if (op.handle.includes('n')) { const nh = Math.max(MIN, b.height - dy); y = b.y + b.height - nh; h = nh }

  setProp(op.elementId, 'x', x)
  setProp(op.elementId, 'y', y)
  setProp(op.elementId, 'width', w)
  setProp(op.elementId, 'height', h)
}
