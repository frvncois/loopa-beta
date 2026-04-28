<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    type="text"
    class="flex-1 min-w-0 h-input bg-bg-3 border border-border rounded-sm px-[7px] font-sans text-xs text-text-1 outline-none transition-colors duration-[140ms] focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-text-4"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
