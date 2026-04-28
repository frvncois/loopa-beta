<script setup lang="ts">
const { modelValue = false, disabled = false } = defineProps<{
  modelValue?: boolean
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="[
      'w-[14px] h-[14px] rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors duration-[140ms]',
      modelValue ? 'bg-accent border-accent' : 'bg-bg-3 border-border hover:border-border-l',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      !disabled && 'cursor-pointer',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <svg
      v-if="modelValue"
      width="9"
      height="7"
      viewBox="0 0 9 7"
      fill="none"
    >
      <path d="M1 3.5L3.5 6L8 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>
