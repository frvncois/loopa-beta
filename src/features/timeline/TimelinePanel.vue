<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import TimelineControls from './TimelineControls.vue'
import TimelineRuler from './TimelineRuler.vue'
import TimelinePlayhead from './TimelinePlayhead.vue'
import TimelineTrackList from './TimelineTrackList.vue'

const LABEL_WIDTH = 160
const RULER_H = 24
const TRACK_H = 26

const timeline  = useTimelineStore()
const doc       = useDocumentStore()
const selection = useSelectionStore()

const animatedElementCount = computed(() => {
  const artboardId = selection.activeArtboardId
  if (!artboardId) return 0
  const artboard = doc.artboardById(artboardId)
  if (!artboard) return 0
  return artboard.elementIds.filter((id) => doc.tracksForElement(id).length > 0).length
})

// PPF fills the available width — frames always span the full ruler
const ppf       = computed(() =>
  containerWidth.value > LABEL_WIDTH
    ? (containerWidth.value - LABEL_WIDTH) / timeline.totalFrames
    : 8,
)
const svgWidth  = computed(() => containerWidth.value || LABEL_WIDTH + timeline.totalFrames * 8)
const svgHeight = computed(() => RULER_H + Math.max(animatedElementCount.value * 9, 4) * TRACK_H)
const playheadX = computed(() => LABEL_WIDTH + timeline.currentFrame * ppf.value)

const scrollEl       = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (!scrollEl.value) return
  ro = new ResizeObserver(([entry]) => {
    containerWidth.value = entry?.contentRect.width ?? 0
  })
  ro.observe(scrollEl.value)
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <div class="flex flex-col h-full">
    <TimelineControls />
    <!-- Scrollable SVG area -->
    <div ref="scrollEl" class="flex-1 overflow-auto min-h-0">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        style="display: block"
      >
        <TimelineRuler
          :total-frames="timeline.totalFrames"
          :pixels-per-frame="ppf"
          :label-width="LABEL_WIDTH"
          :height="RULER_H"
          :total-width="svgWidth"
        />
        <TimelineTrackList
          :pixels-per-frame="ppf"
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
