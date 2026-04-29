<script setup lang="ts">
import { computed } from 'vue'
import type { Track, EasingType } from '@/types/track'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useKeyframeSelection } from '@/composables/useKeyframeSelection'

const props = defineProps<{
  tracks: Track[]
  elementId: string
  rowIndex: number
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const doc     = useDocumentStore()
const history = useHistoryStore()
const kfSel   = useKeyframeSelection()

const rowY    = computed(() => props.rulerHeight + props.rowIndex * props.trackHeight)
const centerY = computed(() => rowY.value + props.trackHeight / 2)

const selectedKfs = computed(() => {
  const result: Array<{ trackId: string; kfId: string; easing: EasingType }> = []
  for (const track of props.tracks) {
    for (const kf of track.keyframes) {
      if (kfSel.isSelected(kf.id)) result.push({ trackId: track.id, kfId: kf.id, easing: kf.easing })
    }
  }
  return result
})

const currentEasing = computed((): EasingType | 'mixed' | null => {
  if (selectedKfs.value.length === 0) return null
  const first = selectedKfs.value[0]!.easing
  return selectedKfs.value.every(k => k.easing === first) ? first : 'mixed'
})

const PRESETS: Array<{ label: string; value: EasingType }> = [
  { label: 'Linear',   value: 'linear' },
  { label: 'Ease In',  value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'In / Out', value: 'ease-in-out' },
]

const CHIP_W  = 52
const CHIP_H  = 18
const CHIP_GAP = 4

function setEasing(easing: EasingType): void {
  if (selectedKfs.value.length === 0) return
  history.transact('Set easing', () => {
    for (const { trackId, kfId } of selectedKfs.value) {
      doc.setKeyframeEasing(trackId, kfId, easing)
    }
  })
}
</script>

<template>
  <g>
    <!-- Row bg -->
    <rect x="0" :y="rowY" width="10000" :height="trackHeight"
      :fill="rowIndex % 2 === 0 ? '#131313' : '#0e0e0e'" />
    <line x1="0" :y1="rowY + trackHeight" x2="10000" :y2="rowY + trackHeight"
      stroke="#1a1a1a" stroke-width="1" />
    <!-- Label bg -->
    <rect x="0" :y="rowY" :width="labelWidth" :height="trackHeight" fill="#111111" />

    <!-- "Easing" label -->
    <text :x="28" :y="centerY + 3.5" font-size="9" fill="#4a4a5c"
      font-family="DM Sans, sans-serif">Easing</text>

    <!-- No keyframe selected -->
    <text v-if="currentEasing === null"
      :x="labelWidth + 10" :y="centerY + 3.5"
      font-size="9" fill="#2e2e2e" font-family="DM Sans, sans-serif">
      Select a keyframe
    </text>

    <!-- Easing preset chips -->
    <g v-else v-for="(preset, i) in PRESETS" :key="preset.value"
      :transform="`translate(${labelWidth + 10 + i * (CHIP_W + CHIP_GAP)}, ${centerY - CHIP_H / 2})`"
      style="cursor: pointer"
      @click="setEasing(preset.value)"
    >
      <rect
        x="0" y="0" :width="CHIP_W" :height="CHIP_H" rx="3"
        :fill="currentEasing === preset.value ? '#4353ff' : '#1c1c1c'"
        :stroke="currentEasing === preset.value ? '#4353ff' : '#2a2a2a'"
        stroke-width="0.75"
      />
      <text
        :x="CHIP_W / 2" :y="CHIP_H / 2 + 3.5"
        font-size="8.5"
        :fill="currentEasing === preset.value ? '#ffffff' : '#5a5a6e'"
        font-family="DM Sans, sans-serif"
        text-anchor="middle"
      >{{ preset.label }}</text>
    </g>
  </g>
</template>
