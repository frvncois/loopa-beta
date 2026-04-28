<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import TimelineControls from './TimelineControls.vue'
import TimelineRuler from './TimelineRuler.vue'
import TimelinePlayhead from './TimelinePlayhead.vue'
import TimelineTrackList from './TimelineTrackList.vue'

const LABEL_WIDTH = 160
const PPF = 8        // pixels per frame
const RULER_H = 24
const TRACK_H = 26

const timeline  = useTimelineStore()
const doc       = useDocumentStore()
const selection = useSelectionStore()

// Count elements with at least one track for generous height estimate.
// The SVG can be taller than visible — the container scrolls.
const animatedElementCount = computed(() => {
  const frameId = selection.activeFrameId
  if (!frameId) return 0
  const frame = doc.frameById(frameId)
  if (!frame) return 0
  return frame.elementIds.filter((id) => doc.tracksForElement(id).length > 0).length
})

const svgWidth  = computed(() => LABEL_WIDTH + timeline.totalFrames * PPF + 80)
// Each element row can expand to ~8 group rows; use that as the upper bound
const svgHeight = computed(() => RULER_H + Math.max(animatedElementCount.value * 9, 4) * TRACK_H)
const playheadX = computed(() => LABEL_WIDTH + timeline.currentFrame * PPF)
</script>

<template>
  <div class="flex flex-col h-full">
    <TimelineControls />
    <!-- Scrollable SVG area -->
    <div class="flex-1 overflow-auto min-h-0">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        style="display: block; min-width: 100%"
      >
        <TimelineRuler
          :total-frames="timeline.totalFrames"
          :pixels-per-frame="PPF"
          :label-width="LABEL_WIDTH"
          :height="RULER_H"
        />
        <TimelineTrackList
          :pixels-per-frame="PPF"
          :label-width="LABEL_WIDTH"
          :track-height="TRACK_H"
          :ruler-height="RULER_H"
        />
        <TimelinePlayhead
          :x="playheadX"
          :total-height="svgHeight"
          :ruler-height="RULER_H"
        />
      </svg>
    </div>
  </div>
</template>
