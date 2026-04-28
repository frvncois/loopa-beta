<script setup lang="ts">
defineProps<{ glow?: boolean }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium tracking-wide select-none"
    :class="glow
      ? 'border-[#4353ff]/40 bg-[#4353ff]/10 text-[#818cff] shadow-[0_0_12px_rgb(67_83_255/0.25)]'
      : 'border-border bg-bg-3 text-text-3'"
  >
    <slot />
  </span>
</template>
