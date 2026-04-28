<script setup lang="ts">
import { useKeyframeDrag } from './composables/useTimelineDrag'

const props = defineProps<{
  x: number     // center x in SVG coords
  y: number     // center y in SVG coords
  trackId: string
  keyframeId: string
  selected?: boolean
}>()

const SIZE = 5
const { onPointerDown, onPointerMove, onPointerUp } = useKeyframeDrag(props.trackId, props.keyframeId)
</script>

<template>
  <rect
    :x="x - SIZE" :y="y - SIZE"
    :width="SIZE * 2" :height="SIZE * 2"
    rx="1"
    transform-origin="${x} ${y}"
    :transform="`rotate(45, ${x}, ${y})`"
    :fill="selected ? '#fbbf24' : '#4353ff'"
    stroke="#0c0c0f"
    stroke-width="1"
    class="cursor-ew-resize"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  />
</template>
