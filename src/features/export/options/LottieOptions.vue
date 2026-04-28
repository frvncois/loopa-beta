<script setup lang="ts">
import type { LottieOptions } from '@/types/export'
import Toggle from '@/ui/Toggle.vue'

const props = defineProps<{ options: LottieOptions }>()
const emit  = defineEmits<{ 'update:options': [LottieOptions] }>()

function toggle(v: boolean): void {
  emit('update:options', { ...props.options, prettyPrint: v })
}
</script>

<template>
  <div class="flex items-center justify-between py-2">
    <span class="text-xs text-text-3">Pretty-print JSON</span>
    <Toggle :model-value="options.prettyPrint" @update:model-value="toggle" />
  </div>
</template>
