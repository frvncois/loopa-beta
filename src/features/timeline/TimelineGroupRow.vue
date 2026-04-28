<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '@/types/track'

const props = defineProps<{
  groupName: string
  tracks: Track[]
  elementId: string
  rowIndex: number
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const emit = defineEmits<{ select: [] }>()

const rowY    = computed(() => props.rulerHeight + props.rowIndex * props.trackHeight)
const centerY = computed(() => rowY.value + props.trackHeight / 2)

// Unique frames across all tracks in this group
const allFrames = computed(() => {
  const seen = new Set<number>()
  for (const track of props.tracks) {
    for (const kf of track.keyframes) seen.add(kf.frame)
  }
  return [...seen].sort((a, b) => a - b)
})

const keyframeX = (frame: number) => props.labelWidth + frame * props.pixelsPerFrame
</script>

<template>
  <g>
    <!-- Row background (slightly different shade for group rows) -->
    <rect
      x="0" :y="rowY"
      width="10000" :height="trackHeight"
      :fill="rowIndex % 2 === 0 ? '#0f0f16' : '#0a0a0d'"
    />
    <!-- Separator line -->
    <line x1="0" :y1="rowY + trackHeight" x2="10000" :y2="rowY + trackHeight" stroke="#1a1a24" stroke-width="1" />
    <!-- Label background -->
    <rect x="0" :y="rowY" :width="labelWidth" :height="trackHeight" fill="#0e0e1a" />

    <!-- Indent + group name -->
    <text
      :x="28" :y="centerY + 4"
      font-size="9"
      fill="#4a4a5c"
      font-family="DM Sans, sans-serif"
      style="cursor: pointer; user-select: none"
      @click.stop="emit('select')"
    >{{ groupName }}</text>

    <!-- Clickable hit area -->
    <rect
      :x="28" :y="rowY"
      :width="labelWidth - 28" :height="trackHeight"
      fill="transparent"
      style="cursor: pointer"
      @click.stop="emit('select')"
    />

    <!-- Group keyframe diamonds (hollow) -->
    <g v-for="frame in allFrames" :key="frame" :transform="`translate(${keyframeX(frame)}, ${centerY})`">
      <rect
        x="-3" y="-3" width="6" height="6" rx="0.5"
        fill="none" stroke="#4a4a5c" stroke-width="1"
        transform="rotate(45)"
      />
    </g>
  </g>
</template>
