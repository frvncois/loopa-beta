<script setup lang="ts">
import type { Track } from '@/types/track'
import TimelineKeyframe from './TimelineKeyframe.vue'

const props = defineProps<{
  track: Track
  elementName: string
  rowIndex: number
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const rowY = () => props.rulerHeight + props.rowIndex * props.trackHeight
const centerY = () => rowY() + props.trackHeight / 2
const keyframeX = (frame: number) => props.labelWidth + frame * props.pixelsPerFrame

// Shorten property path for display: 'fills.0.color' → 'color'
const displayProperty = props.track.property.split('.').at(-1) ?? props.track.property
</script>

<template>
  <g>
    <!-- Row background -->
    <rect
      x="0" :y="rowY()"
      width="10000" :height="trackHeight"
      :fill="rowIndex % 2 === 0 ? '#12121a' : '#0c0c0f'"
    />
    <!-- Separator line -->
    <line
      x1="0" :y1="rowY() + trackHeight"
      x2="10000" :y2="rowY() + trackHeight"
      stroke="#1e1e28" stroke-width="1"
    />
    <!-- Label background -->
    <rect x="0" :y="rowY()" :width="labelWidth" :height="trackHeight" :fill="rowIndex % 2 === 0 ? '#141420' : '#0e0e18'" />
    <!-- Element name -->
    <text
      :x="8" :y="centerY() + 4"
      font-size="10" fill="#6a6a7e" font-family="DM Sans, sans-serif"
      class="select-none pointer-events-none"
    >{{ elementName }}</text>
    <!-- Property name -->
    <text
      :x="labelWidth - 8" :y="centerY() + 4"
      font-size="10" fill="#4a4a5c" font-family="DM Sans, sans-serif"
      text-anchor="end"
      class="select-none pointer-events-none"
    >{{ displayProperty }}</text>
    <!-- Keyframes -->
    <TimelineKeyframe
      v-for="kf in track.keyframes"
      :key="kf.id"
      :x="keyframeX(kf.frame)"
      :y="centerY()"
      :track-id="track.id"
      :keyframe-id="kf.id"
    />
  </g>
</template>
