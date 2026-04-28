<script setup lang="ts">
import { computed } from 'vue'
import { useSelectionStore } from '@/stores/useSelectionStore'
import SelectionOverlay from '@/features/canvas/selection/SelectionOverlay.vue'

const selection = useSelectionStore()

const selectedIds = computed(() => [...selection.selectedIds])
</script>

<template>
  <SelectionOverlay
    v-for="id in selectedIds"
    :key="id"
    :element-id="id"
  />
</template>
