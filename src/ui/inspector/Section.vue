<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="inspector-section">
    <div v-if="title" class="text-xs font-semibold text-text-2 mb-2">{{ title }}</div>
    <slot />
  </div>
</template>
