<script setup lang="ts">
import { computed } from 'vue'
import { useRulerScrub } from './composables/useTimelineDrag'

const props = defineProps<{
  totalFrames: number
  pixelsPerFrame: number
  labelWidth: number
  height: number
}>()

const { onPointerDown, onPointerMove, onPointerUp } = useRulerScrub()

// Tick interval: every 5 frames when zoomed out, every 1 frame if zoomed in enough
const tickStep = computed(() => (props.pixelsPerFrame < 8 ? 10 : 5))

const ticks = computed(() => {
  const result: { frame: number; x: number; major: boolean }[] = []
  for (let f = 0; f <= props.totalFrames; f += tickStep.value) {
    result.push({
      frame: f,
      x: props.labelWidth + f * props.pixelsPerFrame,
      major: f % (tickStep.value * 2) === 0 || f === 0,
    })
  }
  return result
})
</script>

<template>
  <g>
    <!-- Ruler background (click to seek) -->
    <rect
      :x="labelWidth" y="0"
      :width="totalFrames * pixelsPerFrame + 40" :height="height"
      fill="#0e0e18"
      style="cursor: pointer"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    />
    <!-- Label area background -->
    <rect x="0" y="0" :width="labelWidth" :height="height" fill="#0e0e18" />
    <!-- Bottom border -->
    <line x1="0" :y1="height" :x2="totalFrames * pixelsPerFrame + labelWidth + 40" :y2="height"
      stroke="#1e1e28" stroke-width="1" />
    <!-- Ticks -->
    <g v-for="tick in ticks" :key="tick.frame" class="pointer-events-none">
      <line
        :x1="tick.x" :y1="tick.major ? height - 9 : height - 5"
        :x2="tick.x" :y2="height"
        stroke="#2e2e3a" stroke-width="1"
      />
      <text
        v-if="tick.major"
        :x="tick.x + 2" :y="height - 11"
        font-size="9" fill="#4a4a5c" font-family="JetBrains Mono, monospace"
      >{{ tick.frame }}</text>
    </g>
  </g>
</template>
