<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '@/types/track'
import { useKeyframeSelection } from './composables/useKeyframeSelection'
import { useKeyframesDrag } from './composables/useTimelineDrag'

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

const keyframeX = (frame: number) => props.labelWidth + frame * props.pixelsPerFrame

// ── Keyframe selection & drag ─────────────────────────────────────────────

const kfSel = useKeyframeSelection()
const { onKeyframePointerDown, onKeyframePointerMove, onKeyframePointerUp } =
  useKeyframesDrag(() => props.pixelsPerFrame)

// Key by sorted keyframe IDs — stable during drag so pointer capture is preserved
const frameItems = computed(() => {
  const frameMap = new Map<number, string[]>()
  for (const track of props.tracks) {
    for (const kf of track.keyframes) {
      if (!frameMap.has(kf.frame)) frameMap.set(kf.frame, [])
      frameMap.get(kf.frame)!.push(kf.id)
    }
  }
  return [...frameMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([frame, ids]) => ({ frame, key: [...ids].sort().join(','), ids }))
})

function isIdsSelected(ids: string[]): boolean {
  return ids.some(id => kfSel.isSelected(id))
}
</script>

<template>
  <g>
    <!-- Row background (slightly different shade for group rows) -->
    <rect
      x="0" :y="rowY"
      width="10000" :height="trackHeight"
      :fill="rowIndex % 2 === 0 ? '#131313' : '#0e0e0e'"
    />
    <!-- Separator line -->
    <line x1="0" :y1="rowY + trackHeight" x2="10000" :y2="rowY + trackHeight" stroke="#1a1a1a" stroke-width="1" />
    <!-- Label background -->
    <rect x="0" :y="rowY" :width="labelWidth" :height="trackHeight" fill="#111111" />

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

    <!-- Keyframe diamonds (selectable + draggable) -->
    <g
      v-for="item in frameItems"
      :key="item.key"
      :transform="`translate(${keyframeX(item.frame)}, ${centerY})`"
      style="cursor: pointer"
      @pointerdown="(e) => onKeyframePointerDown(e, item.ids, item.frame, e.shiftKey)"
      @pointermove="onKeyframePointerMove"
      @pointerup="onKeyframePointerUp"
    >
      <rect x="-8" y="-8" width="16" height="16" fill="transparent" />
      <rect
        x="-3" y="-3" width="6" height="6" rx="0.5"
        :fill="isIdsSelected(item.ids) ? '#4353ff' : 'none'"
        :stroke="isIdsSelected(item.ids) ? '#4353ff' : '#4a4a5c'"
        stroke-width="1"
        transform="rotate(45)"
      />
    </g>
  </g>
</template>
