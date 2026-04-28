<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [number] }>()

const minVal = props.min ?? 0
const maxVal = props.max ?? 100
</script>

<template>
  <input
    :value="modelValue"
    type="range"
    :min="minVal"
    :max="maxVal"
    :step="step ?? 1"
    :disabled="disabled"
    class="flex-1 min-w-0 h-[3px] rounded-sm appearance-none bg-bg-5 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
    @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>
