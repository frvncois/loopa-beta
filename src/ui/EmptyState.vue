<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
    <div v-if="$slots.icon" class="text-text-4 opacity-40">
      <slot name="icon" />
    </div>
    <p class="text-xs text-text-4">
      <slot>{{ message }}</slot>
    </p>
  </div>
</template>
