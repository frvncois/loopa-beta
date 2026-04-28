<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { computeElementAt } from '@/core/animation/engine'
import { getSnapshotProperties } from '@/core/animation/snapshotProperties'
import { getValueAtPath } from '@/core/utils/valueAtPath'
import type { KeyframeValue } from '@/types/track'
import IconButton from '@/ui/IconButton.vue'
import { IconPlay, IconPause, IconStop, IconKeyframe } from '@/ui/icons'

const timeline  = useTimelineStore()
const selection = useSelectionStore()
const doc       = useDocumentStore()
const history   = useHistoryStore()

// Editable frame counter
const frameInput = ref(String(Math.round(timeline.currentFrame)))

watch(
  () => timeline.currentFrame,
  (v) => { frameInput.value = String(Math.round(v)) },
)

function onFrameBlur(): void {
  const n = parseInt(frameInput.value, 10)
  if (!isNaN(n)) timeline.seek(n)
  else frameInput.value = String(Math.round(timeline.currentFrame))
}

function onFrameKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  if (e.key === 'Escape') { frameInput.value = String(Math.round(timeline.currentFrame)); (e.target as HTMLInputElement).blur() }
}

const hasSelection = computed(() => selection.selectedIds.size > 0)

function addKeyframe(): void {
  if (!hasSelection.value) return
  const frame = Math.round(timeline.currentFrame)
  history.transact('Add keyframe', () => {
    for (const id of selection.selectedIds) {
      const el = doc.elementById(id)
      if (!el) continue
      const animated = computeElementAt(el, doc.tracksForElement(id), frame)
      for (const prop of getSnapshotProperties(el)) {
        const value = getValueAtPath(animated, prop)
        if (value !== undefined) {
          doc.upsertKeyframe(id, prop, frame, value as KeyframeValue)
        }
      }
    }
  })
}

function onGlobalKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'k' && e.key !== 'K') return
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  e.preventDefault()
  addKeyframe()
}

onMounted(() => window.addEventListener('keydown', onGlobalKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeyDown))
</script>

<template>
  <div class="flex items-center gap-1 px-2 h-[34px] border-b border-border flex-shrink-0">
    <!-- Transport -->
    <IconButton size="sm" variant="ghost" title="Stop" @click="timeline.stop"><IconStop /></IconButton>
    <IconButton size="sm" variant="ghost" :active="timeline.isPlaying" title="Play / Pause" @click="timeline.toggle">
      <IconPause v-if="timeline.isPlaying" />
      <IconPlay v-else />
    </IconButton>

    <div class="w-px h-4 bg-border mx-1 flex-shrink-0" />

    <!-- Frame counter -->
    <input
      v-model="frameInput"
      type="text"
      class="w-[42px] h-input-sm bg-bg-3 border border-border rounded-sm px-1.5 font-mono text-[10px] text-text-1 outline-none text-center focus:border-accent transition-colors duration-[140ms]"
      @blur="onFrameBlur"
      @keydown="onFrameKeyDown"
    />
    <span class="text-[10px] text-text-4 font-mono">/</span>
    <span class="text-[10px] text-text-3 font-mono">{{ timeline.totalFrames }}</span>

    <div class="w-px h-4 bg-border mx-1 flex-shrink-0" />

    <!-- FPS -->
    <span class="text-[10px] text-text-4 select-none">{{ timeline.fps }}fps</span>

    <div class="flex-1" />

    <!-- Add Keyframe -->
    <IconButton
      size="sm"
      variant="ghost"
      :disabled="!hasSelection"
      title="Add keyframe (K)"
      @click="addKeyframe"
    ><IconKeyframe /></IconButton>

    <div class="w-px h-4 bg-border mx-1 flex-shrink-0" />

    <!-- Time display -->
    <span class="text-[10px] text-text-3 font-mono select-none">{{ timeline.currentTime }}</span>
  </div>
</template>
