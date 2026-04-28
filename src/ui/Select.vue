<script setup lang="ts">
defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [string] }>()

const chevronStyle = {
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236a6a7e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
}
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    :style="chevronStyle"
    class="flex-1 min-w-0 h-input bg-bg-3 border border-border rounded-sm pl-[7px] pr-5 text-xs text-text-1 outline-none transition-colors duration-[140ms] focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer appearance-none"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >{{ opt.label }}</option>
  </select>
</template>
