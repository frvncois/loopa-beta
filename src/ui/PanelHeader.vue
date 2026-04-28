<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <!-- 34px, uppercase 10px, text-text-3, border-b — matches v1 .p-head exactly -->
  <div class="flex items-center justify-between h-[34px] min-h-[34px] px-[10px] border-b border-border flex-shrink-0">
    <span class="text-[10px] font-semibold uppercase tracking-[0.6px] text-text-3 select-none">
      <slot>{{ title }}</slot>
    </span>
    <div v-if="$slots.actions" class="flex items-center gap-0.5">
      <slot name="actions" />
    </div>
  </div>
</template>
