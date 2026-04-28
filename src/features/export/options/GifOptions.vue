<script setup lang="ts">
import type { GifOptions } from '@/types/export'
import Select from '@/ui/Select.vue'

const props = defineProps<{ options: GifOptions }>()
const emit  = defineEmits<{ 'update:options': [GifOptions] }>()

const scaleOptions = [
  { value: '1', label: '1× (original)' },
  { value: '2', label: '2× (retina)' },
]
const qualityOptions = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

function onScale(v: string): void {
  emit('update:options', { ...props.options, scale: Number(v) })
}
function onQuality(v: string): void {
  emit('update:options', { ...props.options, quality: v as GifOptions['quality'] })
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
      <span class="text-xs text-text-3">Quality</span>
      <div class="w-[120px]">
        <Select :model-value="options.quality" :options="qualityOptions" @update:model-value="onQuality" />
      </div>
    </div>
  </div>
</template>
