<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import TimelineElementRow from './TimelineElementRow.vue'
import TimelineEasingRow from './TimelineEasingRow.vue'

const props = defineProps<{
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const doc       = useDocumentStore()
const selection = useSelectionStore()

interface ElementEntry {
  element: Element
  tracks: Track[]
}

const elementEntries = computed((): ElementEntry[] => {
  const artboardId = selection.activeArtboardId
  if (!artboardId) return []
  const artboard = doc.artboardById(artboardId)
  if (!artboard) return []

  const result: ElementEntry[] = []
  for (const elId of artboard.elementIds) {
    const el = doc.elementById(elId)
    if (!el) continue
    const tracks = doc.tracksForElement(elId)
    if (tracks.length === 0) continue
    result.push({ element: el, tracks })
  }
  return result
})

// ── Expansion state ──────────────────────────────────────────────────────────

const expanded = ref(new Set<string>())

function toggleExpand(elementId: string): void {
  const next = new Set(expanded.value)
  if (next.has(elementId)) next.delete(elementId)
  else next.add(elementId)
  expanded.value = next
}

// ── Flat row list ────────────────────────────────────────────────────────────

type RowItem =
  | { type: 'element'; entry: ElementEntry }
  | { type: 'easing';  elementId: string; tracks: Track[] }

const rows = computed((): RowItem[] => {
  const result: RowItem[] = []
  for (const entry of elementEntries.value) {
    result.push({ type: 'element', entry })
    if (expanded.value.has(entry.element.id)) {
      result.push({ type: 'easing', elementId: entry.element.id, tracks: entry.tracks })
    }
  }
  return result
})
</script>

<template>
  <g>
    <template v-for="(row, i) in rows" :key="row.type === 'element' ? row.entry.element.id : `${row.elementId}:easing`">
      <TimelineElementRow
        v-if="row.type === 'element'"
        :element="row.entry.element"
        :tracks="row.entry.tracks"
        :row-index="i"
        :expanded="expanded.has(row.entry.element.id)"
        :pixels-per-frame="pixelsPerFrame"
        :label-width="labelWidth"
        :track-height="trackHeight"
        :ruler-height="rulerHeight"
        @toggle-expand="toggleExpand(row.entry.element.id)"
        @select="selection.select(row.entry.element.id)"
      />
      <TimelineEasingRow
        v-else
        :tracks="row.tracks"
        :element-id="row.elementId"
        :row-index="i"
        :pixels-per-frame="pixelsPerFrame"
        :label-width="labelWidth"
        :track-height="trackHeight"
        :ruler-height="rulerHeight"
      />
    </template>

    <!-- Empty state -->
    <text
      v-if="rows.length === 0"
      :x="labelWidth + 12"
      :y="rulerHeight + trackHeight / 2 + 4"
      font-size="10"
      fill="#2e2e2e"
      font-family="DM Sans, sans-serif"
    >Press K with an element selected to add a keyframe</text>
  </g>
</template>
