<script setup lang="ts">
import type { PngSequenceOptions } from '@/types/export'
import Select from '@/ui/Select.vue'

const props = defineProps<{ options: PngSequenceOptions }>()
const emit  = defineEmits<{ 'update:options': [PngSequenceOptions] }>()

const scaleOptions = [
  { value: '1', label: '1× (original)' },
  { value: '2', label: '2× (retina)' },
  { value: '3', label: '3×' },
]

function onScale(v: string): void {
  emit('update:options', { ...props.options, scale: Number(v) })
}
</script>

<template>
  <div class="flex items-center justify-between py-2">
    <span class="text-xs text-text-3">Scale</span>
    <div class="w-[120px]">
      <Select
        :model-value="String(options.scale)"
        :options="scaleOptions"
        @update:model-value="onScale"
      />
    </div>
  </div>
</template>
