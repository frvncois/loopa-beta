<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { getPropertyGroup, GROUP_ORDER, type PropertyGroup } from '@/core/animation/propertyGroups'
import TimelineElementRow from './TimelineElementRow.vue'
import TimelineGroupRow from './TimelineGroupRow.vue'

const props = defineProps<{
  pixelsPerFrame: number
  labelWidth: number
  trackHeight: number
  rulerHeight: number
}>()

const doc       = useDocumentStore()
const selection = useSelectionStore()

// ── Data ────────────────────────────────────────────────────────────────────

interface ElementEntry {
  element: Element
  tracks: Track[]
  groups: [PropertyGroup, Track[]][]   // sorted by GROUP_ORDER
}

const elementEntries = computed((): ElementEntry[] => {
  const frameId = selection.activeFrameId
  if (!frameId) return []
  const frame = doc.frameById(frameId)
  if (!frame) return []

  const result: ElementEntry[] = []
  for (const elId of frame.elementIds) {
    const el = doc.elementById(elId)
    if (!el) continue
    const elTracks = doc.tracksForElement(elId)
    if (elTracks.length === 0) continue

    const groupMap = new Map<PropertyGroup, Track[]>()
    for (const track of elTracks) {
      const g = getPropertyGroup(track.property)
      if (!groupMap.has(g)) groupMap.set(g, [])
      groupMap.get(g)!.push(track)
    }

    const groups: [PropertyGroup, Track[]][] = [...groupMap.entries()].sort(
      ([a], [b]) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b),
    )

    result.push({ element: el, tracks: elTracks, groups })
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

// ── Flat row list for rendering ──────────────────────────────────────────────

type RowItem =
  | { type: 'element'; entry: ElementEntry }
  | { type: 'group'; elementId: string; groupName: PropertyGroup; tracks: Track[] }

const rows = computed((): RowItem[] => {
  const result: RowItem[] = []
  for (const entry of elementEntries.value) {
    result.push({ type: 'element', entry })
    if (expanded.value.has(entry.element.id)) {
      for (const [groupName, tracks] of entry.groups) {
        result.push({ type: 'group', elementId: entry.element.id, groupName, tracks })
      }
    }
  }
  return result
})

</script>

<template>
  <g>
    <template v-for="(row, i) in rows" :key="row.type === 'element' ? row.entry.element.id : `${row.elementId}:${row.groupName}`">
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
      <TimelineGroupRow
        v-else
        :group-name="row.groupName"
        :tracks="row.tracks"
        :element-id="row.elementId"
        :row-index="i"
        :pixels-per-frame="pixelsPerFrame"
        :label-width="labelWidth"
        :track-height="trackHeight"
        :ruler-height="rulerHeight"
        @select="selection.select(row.elementId)"
      />
    </template>

    <!-- Empty state -->
    <text
      v-if="rows.length === 0"
      :x="labelWidth + 12"
      :y="rulerHeight + trackHeight / 2 + 4"
      font-size="10"
      fill="#2e2e3a"
      font-family="DM Sans, sans-serif"
    >Press K with an element selected to add a keyframe</text>
  </g>
</template>
