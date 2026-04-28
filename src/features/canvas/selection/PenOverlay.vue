<script setup lang="ts">
import { computed } from 'vue'
import { usePenState } from '@/features/canvas/composables/usePenState'
import { buildSvgPath } from '@/core/path/builder'
import { distance } from '@/core/utils/math'
import type { PathPoint } from '@/types/element'

const { state } = usePenState()

const CLOSE_DIST = 10

// Preview path from committed points (adapted to PathPoint for buildSvgPath)
const previewD = computed((): string => {
  const pts = state.value.points
  if (pts.length < 2) return ''
  const pathPts: PathPoint[] = pts.map((p) => ({
    id: 'preview', x: p.x, y: p.y,
    handleIn: p.handleIn, handleOut: p.handleOut, type: 'corner',
  }))
  return buildSvgPath(pathPts, false)
})

// Rubber-band: last committed point → cursor
const rubberBand = computed(() => {
  const pts    = state.value.points
  const cursor = state.value.cursor
  const last   = pts[pts.length - 1]
  if (!last || !cursor) return null
  // If last point has a handleOut, rubber-band is a bezier from handleOut to cursor
  if (last.handleOut) {
    return { fromX: last.x, fromY: last.y, hx: last.handleOut.x, hy: last.handleOut.y, toX: cursor.x, toY: cursor.y, curved: true }
  }
  return { fromX: last.x, fromY: last.y, toX: cursor.x, toY: cursor.y, curved: false }
})

// Highlight first point when cursor is close enough to close
const nearFirst = computed((): boolean => {
  const pts    = state.value.points
  const cursor = state.value.cursor
  if (!pts[0] || !cursor || pts.length < 2) return false
  return distance(cursor.x, cursor.y, pts[0].x, pts[0].y) < CLOSE_DIST
})
</script>

<template>
  <g v-if="state.active" style="pointer-events: none">

    <!-- Committed segments preview -->
    <path
      v-if="previewD"
      :d="previewD"
      fill="none"
      stroke="#4353ff"
      stroke-width="1.5"
    />

    <!-- Rubber-band to cursor (straight) -->
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

    <!-- Per-point handles and anchors -->
    <g v-for="(pt, i) in state.points" :key="i">
      <!-- Handle stems -->
      <line v-if="pt.handleIn"
        :x1="pt.x" :y1="pt.y" :x2="pt.handleIn.x"  :y2="pt.handleIn.y"
        stroke="#4353ff" stroke-width="1" opacity="0.5" />
      <line v-if="pt.handleOut"
        :x1="pt.x" :y1="pt.y" :x2="pt.handleOut.x" :y2="pt.handleOut.y"
        stroke="#4353ff" stroke-width="1" opacity="0.5" />

      <!-- Handle dots -->
      <circle v-if="pt.handleIn"
        :cx="pt.handleIn.x" :cy="pt.handleIn.y" r="3"
        fill="#fff" stroke="#4353ff" stroke-width="1" />
      <circle v-if="pt.handleOut"
        :cx="pt.handleOut.x" :cy="pt.handleOut.y" r="3"
        fill="#fff" stroke="#4353ff" stroke-width="1" />

      <!-- Anchor — first point gets close-indicator ring -->
      <circle v-if="i === 0 && nearFirst"
        :cx="pt.x" :cy="pt.y" r="8"
        fill="none" stroke="#4353ff" stroke-width="1" opacity="0.45" />
      <circle
        :cx="pt.x" :cy="pt.y" r="4"
        :fill="i === 0 && nearFirst ? '#4353ff' : '#fff'"
        stroke="#4353ff" stroke-width="1.5"
      />
    </g>
  </g>
</template>
