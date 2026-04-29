<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useArtboardActivation } from '@/composables/useArtboardActivation'
import ElementRenderer from '@/features/canvas/renderers/ElementRenderer.vue'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const { activateArtboard } = useArtboardActivation()

const artboards = computed(() => doc.artboards)
const activeId  = computed(() => selection.activeArtboardId)

function onBgPointerDown(e: PointerEvent, artboardId: string): void {
  if (artboardId !== activeId.value) {
    // Inactive artboard — activate it and consume the event (no marquee, no tool)
    activateArtboard(artboardId)
    e.stopPropagation()
    return
  }
  // Active artboard empty-space click: let event bubble to SelectTool (marquee/deselect)
}
</script>

<template>
  <g v-for="artboard in artboards" :key="artboard.id">
    <!-- Artboard label -->
    <text
      :x="artboard.canvasX"
      :y="artboard.canvasY - 8"
      font-size="11"
      font-family="DM Sans, sans-serif"
      fill="#ededf0"
      :opacity="artboard.id === activeId ? 0.7 : 0.3"
      style="pointer-events: none; user-select: none"
    >{{ artboard.name }}</text>

    <!-- Artboard background -->
    <rect
      :x="artboard.canvasX"
      :y="artboard.canvasY"
      :width="artboard.width"
      :height="artboard.height"
      :fill="'#' + artboard.backgroundColor"
      style="cursor: default"
      @pointerdown="onBgPointerDown($event, artboard.id)"
    />

    <!-- Elements for this artboard (inactive: pointer-events off so bg click activates) -->
    <g :style="artboard.id !== activeId ? 'pointer-events: none' : undefined">
      <ElementRenderer
        v-for="elId in artboard.elementIds"
        :key="elId"
        :element-id="elId"
      />
    </g>

    <!-- Inactive dim overlay -->
    <rect
      v-if="artboard.id !== activeId"
      :x="artboard.canvasX"
      :y="artboard.canvasY"
      :width="artboard.width"
      :height="artboard.height"
      fill="rgba(12,12,15,0.55)"
      style="pointer-events: none"
    />

    <!-- Active artboard accent border -->
    <rect
      v-if="artboard.id === activeId"
      :x="artboard.canvasX"
      :y="artboard.canvasY"
      :width="artboard.width"
      :height="artboard.height"
      fill="none"
      stroke="#4353ff"
      stroke-width="2"
      style="pointer-events: none"
    />

    <!-- Inactive artboard border (subtle) -->
    <rect
      v-if="artboard.id !== activeId"
      :x="artboard.canvasX"
      :y="artboard.canvasY"
      :width="artboard.width"
      :height="artboard.height"
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      stroke-width="1"
      style="pointer-events: none"
    />
  </g>
</template>
