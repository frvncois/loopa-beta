<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string   // hex without #
  alpha?: number       // 0..1, optional
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  'update:alpha': [number]
  'open-picker': []
}>()

const hexDisplay = ref(props.modelValue.toUpperCase())

function onHexInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  hexDisplay.value = val
  const clean = val.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  if (clean.length === 6) emit('update:modelValue', clean)
}

function onHexBlur() {
  const clean = hexDisplay.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  if (clean.length === 6) {
    emit('update:modelValue', clean)
    hexDisplay.value = clean.toUpperCase()
  } else {
    hexDisplay.value = props.modelValue.toUpperCase()
  }
}
</script>

<template>
  <div class="flex-1 min-w-0 h-input flex items-stretch border border-border rounded-sm overflow-hidden transition-colors duration-[140ms] focus-within:border-accent">
    <!-- Swatch -->
    <button
      type="button"
      class="w-input min-w-input h-full flex items-center justify-center border-r border-border bg-transparent flex-shrink-0 hover:bg-bg-4 transition-colors duration-[140ms]"
      @click="$emit('open-picker')"
    >
      <span
        class="w-4 h-4 rounded-[3px]"
        :style="{ background: '#' + modelValue, border: '1px solid rgba(255,255,255,0.08)' }"
      />
    </button>
    <!-- Hex input -->
    <input
      :value="hexDisplay"
      type="text"
      maxlength="7"
      placeholder="HEX"
      class="flex-1 min-w-0 h-full bg-transparent border-none outline-none px-[7px] font-mono text-xs text-text-1 placeholder:text-text-4"
      @input="onHexInput"
      @blur="onHexBlur"
    />
  </div>
</template>
