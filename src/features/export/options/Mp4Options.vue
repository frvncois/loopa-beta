<script setup lang="ts">
import type { Mp4Options } from '@/types/export'
import Select from '@/ui/Select.vue'
import NumberField from '@/ui/NumberField.vue'

const props = defineProps<{ options: Mp4Options }>()
const emit  = defineEmits<{ 'update:options': [Mp4Options] }>()

const scaleOptions = [
  { value: '1', label: '1× (original)' },
  { value: '2', label: '2× (retina)' },
]

function onScale(v: string): void {
  emit('update:options', { ...props.options, scale: Number(v) })
}
function onBitrate(v: number): void {
  emit('update:options', { ...props.options, bitrate: v })
}
</script>

<template>
  <div class="flex flex-col gap-2 py-2">
    <div class="flex items-center justify-between">
      <span class="text-xs text-text-3">Scale</span>
      <div class="w-[120px]">
        <Select :model-value="String(options.scale)" :options="scaleOptions" @update:model-value="onScale" />
      </div>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-text-3">Bitrate (kbps)</span>
      <div class="w-[120px]">
        <NumberField :model-value="options.bitrate" :min="500" :max="50000" :step="500" @update:model-value="onBitrate" />
      </div>
    </div>
  </div>
</template>
