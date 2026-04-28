<script setup lang="ts">
import { usePlayheadDrag } from './composables/useTimelineDrag'

const props = defineProps<{
  x: number           // SVG x position
  totalHeight: number
  rulerHeight: number
}>()

const { onPointerDown, onPointerMove, onPointerUp } = usePlayheadDrag()
</script>

<template>
  <g style="pointer-events: none">
    <!-- Playhead line -->
    <line
      :x1="x" y1="0"
      :x2="x" :y2="totalHeight"
      stroke="#4353ff"
      stroke-width="1"
    />
    <!-- Draggable handle (top triangle) -->
    <polygon
      :points="`${x - 5},0 ${x + 5},0 ${x},10`"
      fill="#4353ff"
      style="cursor: ew-resize; pointer-events: all"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    />
    <!-- Frame position indicator inside ruler -->
    <rect
      :x="x - 0.5" :y="0"
      width="1" :height="rulerHeight"
      fill="#4353ff"
      style="pointer-events: all; cursor: ew-resize"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    />
  </g>
</template>
