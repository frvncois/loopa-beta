<script setup lang="ts">
import { computed } from 'vue'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCanvasViewport } from '@/features/canvas/composables/useCanvasViewport'
import { computeElementAt } from '@/core/animation/engine'
import { buildSvgPath } from '@/core/path/builder'
import type { PathElement, PathPoint } from '@/types/element'

const selection = useSelectionStore()
const doc       = useDocumentStore()
const history   = useHistoryStore()
const timeline  = useTimelineStore()
const { screenToSvg } = useCanvasViewport()

// Animated path (world-positioned, local-coord points)
const path = computed((): PathElement | null => {
  const id = selection.editingPathId
  if (!id) return null
  const base = doc.elementById(id)
  if (!base || base.type !== 'path') return null
  return computeElementAt(base, doc.tracksForElement(id), Math.round(timeline.currentFrame)) as PathElement
})

// ── Drag state ───────────────────────────────────────────────────────────────

type DragType = 'anchor' | 'handleIn' | 'handleOut'
let dragType:  DragType | null = null
let dragIdx    = 0
let startSvg:  { x: number; y: number } | null = null
let startPt:   PathPoint | null = null

function rawPoints(): PathPoint[] {
  const id = selection.editingPathId
  if (!id) return []
  const el = doc.elementById(id)
  return el?.type === 'path' ? [...el.points] : []
}

function savePoints(pts: PathPoint[]): void {
  const id = selection.editingPathId
  if (!id) return
  const el = doc.elementById(id)
  if (!el || el.type !== 'path') return
  doc.updateElement(id, { points: pts, d: buildSvgPath(pts, el.closed) })
}

// ── Pointer events ───────────────────────────────────────────────────────────

function startAnchorDrag(e: PointerEvent, idx: number): void {
  e.stopPropagation()
  ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
  dragType = 'anchor'
  dragIdx  = idx
  startSvg = screenToSvg(e.clientX, e.clientY)
  startPt  = { ...rawPoints()[idx]! }
  history.beginTransaction('Move point')
}

function startHandleDrag(e: PointerEvent, idx: number, type: 'handleIn' | 'handleOut'): void {
  e.stopPropagation()
  ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
  dragType = type
  dragIdx  = idx
  startSvg = screenToSvg(e.clientX, e.clientY)
  const pt = rawPoints()[idx]
  startPt  = pt ? { ...pt } : null
  history.beginTransaction('Move handle')
}

function onMove(e: PointerEvent): void {
  if (!dragType || !startSvg || !startPt) return
  const cur = screenToSvg(e.clientX, e.clientY)
  const dx  = cur.x - startSvg.x
  const dy  = cur.y - startSvg.y
  const pts = rawPoints()
  const pt  = pts[dragIdx]
  if (!pt) return

  if (dragType === 'anchor') {
    pts[dragIdx] = {
      ...pt,
      x: startPt.x + dx,
      y: startPt.y + dy,
      handleIn:  startPt.handleIn  ? { x: startPt.handleIn.x  + dx, y: startPt.handleIn.y  + dy } : null,
      handleOut: startPt.handleOut ? { x: startPt.handleOut.x + dx, y: startPt.handleOut.y + dy } : null,
    }
  } else if (dragType === 'handleIn') {
    pts[dragIdx] = {
      ...pt,
      handleIn: { x: (startPt.handleIn?.x ?? startPt.x) + dx, y: (startPt.handleIn?.y ?? startPt.y) + dy },
    }
  } else {
    pts[dragIdx] = {
      ...pt,
      handleOut: { x: (startPt.handleOut?.x ?? startPt.x) + dx, y: (startPt.handleOut?.y ?? startPt.y) + dy },
    }
  }
  savePoints(pts)
}

function onUp(e: PointerEvent): void {
  if (!dragType) return
  ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  dragType = null
  startSvg = null
  startPt  = null
  history.commit()
}

// Alt+click anchor → delete point
function onAnchorClick(e: MouseEvent, idx: number): void {
  if (!e.altKey) return
  e.stopPropagation()
  const pts = rawPoints()
  if (pts.length <= 2) return
  pts.splice(idx, 1)
  const id = selection.editingPathId!
  const el = doc.elementById(id)
  if (!el || el.type !== 'path') return
  history.transact('Delete point', () => {
    doc.updateElement(id, { points: pts, d: buildSvgPath(pts, el.closed) })
  })
}
</script>

<template>
  <g v-if="path">
    <g v-for="(pt, i) in path.points" :key="i">
      <!-- Handle stems (world = path.x + local) -->
      <line v-if="pt.handleIn"
        :x1="path.x + pt.x"          :y1="path.y + pt.y"
        :x2="path.x + pt.handleIn.x"  :y2="path.y + pt.handleIn.y"
        stroke="#4353ff" stroke-width="1" style="pointer-events: none" />
      <line v-if="pt.handleOut"
        :x1="path.x + pt.x"           :y1="path.y + pt.y"
        :x2="path.x + pt.handleOut.x" :y2="path.y + pt.handleOut.y"
        stroke="#4353ff" stroke-width="1" style="pointer-events: none" />

      <!-- handleIn square -->
      <rect v-if="pt.handleIn"
        :x="path.x + pt.handleIn.x - 3" :y="path.y + pt.handleIn.y - 3"
        width="6" height="6"
        fill="#fff" stroke="#4353ff" stroke-width="1"
        style="cursor: crosshair"
        @pointerdown="startHandleDrag($event, i, 'handleIn')"
        @pointermove="onMove" @pointerup="onUp"
      />

      <!-- handleOut square -->
      <rect v-if="pt.handleOut"
        :x="path.x + pt.handleOut.x - 3" :y="path.y + pt.handleOut.y - 3"
        width="6" height="6"
        fill="#fff" stroke="#4353ff" stroke-width="1"
        style="cursor: crosshair"
        @pointerdown="startHandleDrag($event, i, 'handleOut')"
        @pointermove="onMove" @pointerup="onUp"
      />

      <!-- Anchor circle -->
      <circle
        :cx="path.x + pt.x" :cy="path.y + pt.y" r="4"
        fill="#fff" stroke="#4353ff" stroke-width="1.5"
        style="cursor: move"
        @pointerdown="startAnchorDrag($event, i)"
        @pointermove="onMove" @pointerup="onUp"
        @click="onAnchorClick($event, i)"
      />
    </g>
  </g>
</template>
