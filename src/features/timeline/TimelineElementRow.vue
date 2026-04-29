<script setup lang="ts">
import { computed } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useKeyframeSelection } from './composables/useKeyframeSelection'
import { useKeyframesDrag } from './composables/useTimelineDrag'

const props = defineProps<{
  element: Element
  tracks: Track[]
  rowIndex: number
  expanded: boolean
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const emit = defineEmits<{
  toggleExpand: []
  select: []
}>()

const selection  = useSelectionStore()
const isSelected = computed(() => selection.selectedIds.has(props.element.id))
const rowY       = computed(() => props.rulerHeight + props.rowIndex * props.trackHeight)
const centerY    = computed(() => rowY.value + props.trackHeight / 2)

const keyframeX = (frame: number) => props.labelWidth + frame * props.pixelsPerFrame

// ── Keyframe selection & drag ─────────────────────────────────────────────

const kfSel = useKeyframeSelection()
const { onKeyframePointerDown, onKeyframePointerMove, onKeyframePointerUp } =
  useKeyframesDrag(() => props.pixelsPerFrame)

// Group keyframes by frame. Key is sorted keyframe IDs — stable during drag
// so Vue reuses the same <g> element and pointer capture is preserved.
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
    <!-- Row background -->
    <rect
      x="0" :y="rowY"
      width="10000" :height="trackHeight"
      :fill="isSelected ? '#1c1c1c' : rowIndex % 2 === 0 ? '#161616' : '#111111'"
    />
    <!-- Selected accent bar -->
    <rect v-if="isSelected" x="0" :y="rowY" width="2" :height="trackHeight" fill="#4353ff" />
    <!-- Separator line -->
    <line x1="0" :y1="rowY + trackHeight" x2="10000" :y2="rowY + trackHeight" stroke="#1e1e1e" stroke-width="1" />
    <!-- Label background -->
    <rect x="0" :y="rowY" :width="labelWidth" :height="trackHeight" :fill="isSelected ? '#1e1e1e' : '#141414'" />

    <!-- Chevron toggle -->
    <g :transform="`translate(8, ${centerY})`" style="cursor: pointer" @click.stop="emit('toggleExpand')">
      <rect x="-4" y="-6" width="12" height="12" fill="transparent" />
      <path
        v-if="!expanded"
        d="M0,-3.5 L3.5,0 L0,3.5"
        stroke="#4a4a5c" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"
      />
      <path
        v-else
        d="M-3.5,0 L0,3.5 L3.5,0"
        stroke="#6a6a7e" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"
      />
    </g>

    <!-- Element name (clickable) -->
    <text
      :x="20" :y="centerY + 4"
      font-size="10"
      :fill="isSelected ? '#ededf0' : '#8a8a9e'"
      font-family="DM Sans, sans-serif"
      font-weight="500"
      style="cursor: pointer; user-select: none"
      @click.stop="emit('select')"
    >{{ element.name }}</text>

    <!-- Clickable hit area over label -->
    <rect
      :x="20" :y="rowY"
      :width="labelWidth - 20" :height="trackHeight"
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
        x="-3.5" y="-3.5" width="7" height="7" rx="0.5"
        :fill="isIdsSelected(item.ids) ? '#4353ff' : '#4a4a5c'"
        transform="rotate(45)"
      />
    </g>
  </g>
</template>
