<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useFrameActivation } from '@/composables/useFrameActivation'
import ElementRenderer from '@/features/canvas/renderers/ElementRenderer.vue'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const { activateFrame } = useFrameActivation()

const frames = computed(() => doc.frames)
const activeId = computed(() => selection.activeFrameId)

function onBgPointerDown(e: PointerEvent, frameId: string): void {
  if (frameId !== activeId.value) {
    // Inactive frame — activate it and consume the event (no marquee, no tool)
    activateFrame(frameId)
    e.stopPropagation()
    return
  }
  // Active frame empty-space click: let event bubble to SelectTool (marquee/deselect)
}
</script>

<template>
  <g v-for="frame in frames" :key="frame.id">
    <!-- Frame label -->
    <text
      :x="frame.canvasX"
      :y="frame.canvasY - 8"
      font-size="11"
      font-family="DM Sans, sans-serif"
      fill="#ededf0"
      :opacity="frame.id === activeId ? 0.7 : 0.3"
      style="pointer-events: none; user-select: none"
    >{{ frame.name }}</text>

    <!-- Artboard background -->
    <rect
      :x="frame.canvasX"
      :y="frame.canvasY"
      :width="frame.width"
      :height="frame.height"
      :fill="'#' + frame.backgroundColor"
      style="cursor: default"
      @pointerdown="onBgPointerDown($event, frame.id)"
    />

    <!-- Elements for this frame (inactive frames: pointer-events off so bg click activates) -->
    <g :style="frame.id !== activeId ? 'pointer-events: none' : undefined">
      <ElementRenderer
        v-for="elId in frame.elementIds"
        :key="elId"
        :element-id="elId"
      />
    </g>

    <!-- Inactive dim overlay -->
    <rect
      v-if="frame.id !== activeId"
      :x="frame.canvasX"
      :y="frame.canvasY"
      :width="frame.width"
      :height="frame.height"
      fill="rgba(12,12,15,0.55)"
      style="pointer-events: none"
    />

    <!-- Active frame accent border -->
    <rect
      v-if="frame.id === activeId"
      :x="frame.canvasX"
      :y="frame.canvasY"
      :width="frame.width"
      :height="frame.height"
      fill="none"
      stroke="#4353ff"
      stroke-width="2"
      style="pointer-events: none"
    />

    <!-- Inactive frame border (subtle) -->
    <rect
      v-if="frame.id !== activeId"
      :x="frame.canvasX"
      :y="frame.canvasY"
      :width="frame.width"
      :height="frame.height"
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      stroke-width="1"
      style="pointer-events: none"
    />
  </g>
</template>
