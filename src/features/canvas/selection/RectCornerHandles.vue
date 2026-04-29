<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useToolStore } from '@/stores/useToolStore'
import { useCanvasViewport } from '@/features/canvas/composables/useCanvasViewport'
import { computeElementAt } from '@/core/animation/engine'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import type { RectElement } from '@/types/element'

const sel       = useSelectionStore()
const doc       = useDocumentStore()
const history   = useHistoryStore()
const timeline  = useTimelineStore()
const toolStore = useToolStore()
const { screenToSvg } = useCanvasViewport()

// Animated rect at current frame (guards tool + single selection + rect type)
const rect = computed((): RectElement | null => {
  if (toolStore.currentTool !== 'shape-edit') return null
  const ids = sel.selectedIds
  if (ids.length !== 1) return null
  const eid  = ids[0]!
  const base = doc.elementById(eid)
  if (!base || base.type !== 'rect') return null
  if (base.locked || !base.visible) return null
  return computeElementAt(base, doc.tracksForElement(eid), Math.round(timeline.currentFrame)) as RectElement
})

// Auto-exit when rect is deleted or deselected
watch(rect, (r) => {
  if (!r && toolStore.currentTool === 'shape-edit') toolStore.setTool('select')
})

// Animated property writers for the four corner radii
const id = computed(() => sel.selectedIds[0] ?? '')
const { value: tlRadius } = useAnimatedProperty<number>(id, ref('radiusTopLeft'))
const { value: trRadius } = useAnimatedProperty<number>(id, ref('radiusTopRight'))
const { value: brRadius } = useAnimatedProperty<number>(id, ref('radiusBottomRight'))
const { value: blRadius } = useAnimatedProperty<number>(id, ref('radiusBottomLeft'))

// ── Drag state ───────────────────────────────────────────────────────────────

type HandleId = 'tl' | 'tr' | 'br' | 'bl'
let dragging   = null as HandleId | null
let startSvgX  = 0
let startRTL   = 0
let startRTR   = 0
let startRBR   = 0
let startRBL   = 0

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function startDrag(e: PointerEvent, h: HandleId): void {
  e.stopPropagation()
  ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
  dragging   = h
  startSvgX  = screenToSvg(e.clientX, e.clientY).x
  const r    = rect.value!
  startRTL   = r.radiusTopLeft
  startRTR   = r.radiusTopRight
  startRBR   = r.radiusBottomRight
  startRBL   = r.radiusBottomLeft
  history.beginTransaction('Adjust corner radius')
}

function onMove(e: PointerEvent): void {
  if (!dragging || !rect.value) return
  const dx     = screenToSvg(e.clientX, e.clientY).x - startSvgX
  const maxR   = Math.min(rect.value.width, rect.value.height) / 2
  const linked = rect.value.radiusLinked

  // TL/BL: drag right → increase; TR/BR: drag left → increase
  const signs: Record<HandleId, 1 | -1> = { tl: 1, tr: -1, br: -1, bl: 1 }
  const startR: Record<HandleId, number> = { tl: startRTL, tr: startRTR, br: startRBR, bl: startRBL }
  const v = clamp(startR[dragging] + signs[dragging] * dx, 0, maxR)

  if (linked) {
    tlRadius.value = v; trRadius.value = v
    brRadius.value = v; blRadius.value = v
  } else if (dragging === 'tl') {
    tlRadius.value = v
  } else if (dragging === 'tr') {
    trRadius.value = v
  } else if (dragging === 'br') {
    brRadius.value = v
  } else {
    blRadius.value = v
  }
}

function onUp(e: PointerEvent): void {
  if (!dragging) return
  ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  dragging = null
  history.commit()
}
</script>

<template>
  <g v-if="rect">
    <!-- TL: on top edge, offset right by radiusTopLeft -->
    <circle
      :cx="rect.x + rect.radiusTopLeft" :cy="rect.y"
      r="4" fill="#fff" stroke="#4353ff" stroke-width="1.5"
      style="cursor: ew-resize"
      @pointerdown="startDrag($event, 'tl')"
      @pointermove="onMove" @pointerup="onUp"
    />
    <!-- TR: on top edge, offset left from right by radiusTopRight -->
    <circle
      :cx="rect.x + rect.width - rect.radiusTopRight" :cy="rect.y"
      r="4" fill="#fff" stroke="#4353ff" stroke-width="1.5"
      style="cursor: ew-resize"
      @pointerdown="startDrag($event, 'tr')"
      @pointermove="onMove" @pointerup="onUp"
    />
    <!-- BR: on bottom edge, offset left from right by radiusBottomRight -->
    <circle
      :cx="rect.x + rect.width - rect.radiusBottomRight" :cy="rect.y + rect.height"
      r="4" fill="#fff" stroke="#4353ff" stroke-width="1.5"
      style="cursor: ew-resize"
      @pointerdown="startDrag($event, 'br')"
      @pointermove="onMove" @pointerup="onUp"
    />
    <!-- BL: on bottom edge, offset right by radiusBottomLeft -->
    <circle
      :cx="rect.x + rect.radiusBottomLeft" :cy="rect.y + rect.height"
      r="4" fill="#fff" stroke="#4353ff" stroke-width="1.5"
      style="cursor: ew-resize"
      @pointerdown="startDrag($event, 'bl')"
      @pointermove="onMove" @pointerup="onUp"
    />
  </g>
</template>
