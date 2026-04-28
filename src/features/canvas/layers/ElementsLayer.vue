<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import ElementRenderer from '@/features/canvas/renderers/ElementRenderer.vue'

const doc       = useDocumentStore()
const selection = useSelectionStore()

const elementIds = computed(() => {
  const frameId = selection.activeFrameId
  if (!frameId) return []
  const frame = doc.frameById(frameId)
  return frame?.elementIds ?? []
})
</script>

<template>
  <ElementRenderer
    v-for="id in elementIds"
    :key="id"
    :element-id="id"
  />
</template>
