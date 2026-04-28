<script setup lang="ts">
const { modelValue = false, disabled = false } = defineProps<{
  modelValue?: boolean
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <!-- 28×16 pill, 12px circle thumb -->
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="[
      'relative w-7 h-4 rounded-full transition-colors duration-[140ms] flex-shrink-0',
      modelValue ? 'bg-accent' : 'bg-bg-4',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      !disabled && 'cursor-pointer',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <!-- 12px thumb: off at left:2px, on at translate-x-3 (12px) -->
    <span
      :class="[
        'absolute top-[2px] left-[2px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-[140ms]',
        modelValue ? 'translate-x-3' : 'translate-x-0',
      ]"
    />
  </button>
</template>
