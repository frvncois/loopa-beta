<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useToolStore } from '@/stores/useToolStore'
import { useMotionPathState } from '@/composables/useMotionPathState'
import { computeElementAt } from '@/core/animation/engine'
import { buildSvgPath } from '@/core/path/builder'
import { distance } from '@/core/utils/math'
import type { PathElement, PathPoint } from '@/types/element'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const tl        = useTimelineStore()
const tool      = useToolStore()
const mpState   = useMotionPathState()

const CLOSE_DIST = 10

// ── Committed motion paths ────────────────────────────────────────────────

interface PathOverlay {
  id: string
  d: string
  transform: string
  startPt: { x: number; y: number }
  endPt:   { x: number; y: number }
}

const pathOverlays = computed((): PathOverlay[] => {
  const selected = selection.selectedIds
  return doc.motionPaths.flatMap((mp) => {
    if (!selected.has(mp.elementId) && !selected.has(mp.pathElementId)) return []
    const base = doc.elementById(mp.pathElementId)
    if (!base || base.type !== 'path') return []
    const animated = computeElementAt(
      base, doc.tracksForElement(mp.pathElementId), tl.currentFrame,
    ) as PathElement
    if (!animated.points.length) return []

    const d         = animated.d || buildSvgPath(animated.points, animated.closed)
    const transform = `translate(${animated.x} ${animated.y})`
    const first     = animated.points[0]!
    const last      = animated.points[animated.points.length - 1]!
    const startPt   = { x: animated.x + first.x, y: animated.y + first.y }
    const endPt     = { x: animated.x + last.x,  y: animated.y + last.y  }

    return [{ id: mp.id, d, transform, startPt, endPt }]
  })
})

// ── In-progress drawing ───────────────────────────────────────────────────

const isDrawing = computed(() =>
  tool.currentTool === 'motion-path' && mpState.state.value.phase === 'drawing',
)
const isPicking = computed(() =>
  tool.currentTool === 'motion-path' && mpState.state.value.phase === 'picking',
)

const previewD = computed((): string => {
  const pts = mpState.state.value.points
  if (pts.length < 2) return ''
  const pathPts: PathPoint[] = pts.map((p) => ({
    id: 'preview', x: p.x, y: p.y,
    handleIn: p.handleIn, handleOut: p.handleOut, type: 'corner',
  }))
  return buildSvgPath(pathPts, false)
})

const rubberBand = computed(() => {
  const pts    = mpState.state.value.points
  const cursor = mpState.state.value.cursor
  const last   = pts[pts.length - 1]
  if (!last || !cursor) return null
  if (last.handleOut) {
    return {
      fromX: last.x, fromY: last.y,
      hx: last.handleOut.x, hy: last.handleOut.y,
      toX: cursor.x, toY: cursor.y, curved: true,
    }
  }
  return { fromX: last.x, fromY: last.y, toX: cursor.x, toY: cursor.y, curved: false }
})

const nearFirst = computed((): boolean => {
  const pts    = mpState.state.value.points
  const cursor = mpState.state.value.cursor
  if (!pts[0] || !cursor || pts.length < 2) return false
  return distance(cursor.x, cursor.y, pts[0].x, pts[0].y) < CLOSE_DIST
})
</script>

<template>
  <!-- Committed motion path overlays -->
  <g
    v-for="ov in pathOverlays"
    :key="ov.id"
    style="pointer-events: none"
  >
    <path
      :d="ov.d"
      :transform="ov.transform"
      fill="none"
      stroke="#4353ff"
      stroke-width="1.5"
      stroke-dasharray="5 3"
      opacity="0.7"
    />
    <!-- Start marker: hollow circle -->
    <circle
      :cx="ov.startPt.x" :cy="ov.startPt.y" r="4"
      fill="none" stroke="#4353ff" stroke-width="1.5"
    />
    <!-- End marker: filled circle -->
    <circle
      :cx="ov.endPt.x" :cy="ov.endPt.y" r="4"
      fill="#4353ff" stroke="#4353ff" stroke-width="1.5"
    />
  </g>

  <!-- Drawing phase: in-progress path -->
  <g v-if="isDrawing" style="pointer-events: none">
    <path
      v-if="previewD"
      :d="previewD"
      fill="none"
      stroke="#4353ff"
      stroke-width="1.5"
    />

    <!-- Rubber-band (straight) -->
    <line
      v-if="rubberBand && !rubberBand.curved"
      :x1="rubberBand.fromX" :y1="rubberBand.fromY"
      :x2="rubberBand.toX"   :y2="rubberBand.toY"
      stroke="#4353ff" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"
    />

    <!-- Rubber-band (curved from handle) -->
    <path
      v-if="rubberBand && rubberBand.curved"
      :d="`M ${rubberBand.fromX} ${rubberBand.fromY} C ${rubberBand.hx} ${rubberBand.hy} ${rubberBand.toX} ${rubberBand.toY} ${rubberBand.toX} ${rubberBand.toY}`"
      fill="none" stroke="#4353ff" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"
    />

    <!-- Per-anchor handles and dots -->
    <g v-for="(pt, i) in mpState.state.value.points" :key="i">
      <line v-if="pt.handleIn"
        :x1="pt.x" :y1="pt.y" :x2="pt.handleIn.x"  :y2="pt.handleIn.y"
        stroke="#4353ff" stroke-width="1" opacity="0.5"
      />
      <line v-if="pt.handleOut"
        :x1="pt.x" :y1="pt.y" :x2="pt.handleOut.x" :y2="pt.handleOut.y"
        stroke="#4353ff" stroke-width="1" opacity="0.5"
      />
      <circle v-if="pt.handleIn"
        :cx="pt.handleIn.x" :cy="pt.handleIn.y" r="3"
        fill="#fff" stroke="#4353ff" stroke-width="1"
      />
      <circle v-if="pt.handleOut"
        :cx="pt.handleOut.x" :cy="pt.handleOut.y" r="3"
        fill="#fff" stroke="#4353ff" stroke-width="1"
      />
      <!-- Close indicator ring on first anchor -->
      <circle v-if="i === 0 && nearFirst"
        :cx="pt.x" :cy="pt.y" r="8"
        fill="none" stroke="#4353ff" stroke-width="1" opacity="0.45"
      />
      <circle
        :cx="pt.x" :cy="pt.y" r="4"
        :fill="i === 0 && nearFirst ? '#4353ff' : '#fff'"
        stroke="#4353ff" stroke-width="1.5"
      />
    </g>
  </g>

  <!-- Picking phase: crosshair hint at cursor -->
  <g
    v-if="isPicking && mpState.state.value.cursor"
    style="pointer-events: none"
  >
    <circle
      :cx="mpState.state.value.cursor.x"
      :cy="mpState.state.value.cursor.y"
      r="8"
      fill="none"
      stroke="#4353ff"
      stroke-width="1.5"
      opacity="0.5"
    />
  </g>
</template>
