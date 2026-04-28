<script setup lang="ts">
defineProps<{ vertical?: boolean }>()
</script>

<template>
  <div
    :class="vertical
      ? 'w-px self-stretch bg-border mx-1'
      : 'h-px w-full bg-border my-0.5'"
  />
</template>
