<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  precision?: number
  paired?: boolean
  disabled?: boolean
  unit?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const isFocused = ref(false)

function fmt(v: number): string {
  return props.precision !== undefined ? v.toFixed(props.precision) : String(v)
}

const display = ref(fmt(props.modelValue))

watch(
  () => props.modelValue,
  (v) => { if (!isFocused.value) display.value = fmt(v) },
)

function clampVal(v: number): number {
  let r = v
  if (props.min !== undefined) r = Math.max(props.min, r)
  if (props.max !== undefined) r = Math.min(props.max, r)
  return r
}

// ── Scrub ─────────────────────────────────────────────────────────────────
let scrubStartX = 0
let scrubStartVal = 0
let scrubbing = false

function onPointerDown(e: PointerEvent) {
  if (isFocused.value || props.disabled) return
  e.preventDefault()
  scrubbing = true
  scrubStartX = e.clientX
  scrubStartVal = props.modelValue
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!scrubbing) return
  const dx = e.clientX - scrubStartX
  const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
  const step = (props.step ?? 1) * mult
  let v = scrubStartVal + dx * step
  if (props.precision !== undefined) v = parseFloat(v.toFixed(props.precision))
  emit('update:modelValue', clampVal(v))
}

function onPointerUp() {
  scrubbing = false
}

// ── Keyboard ─────────────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const dir = e.key === 'ArrowUp' ? 1 : -1
    const mult = e.shiftKey ? 10 : 1
    const step = (props.step ?? 1) * mult
    const next = clampVal(props.modelValue + dir * step)
    emit('update:modelValue', next)
    display.value = fmt(next)
  }
}

function onFocus() {
  isFocused.value = true
  display.value = fmt(props.modelValue)
}

function onBlur() {
  isFocused.value = false
  const parsed = parseFloat(display.value)
  const next = isNaN(parsed) ? props.modelValue : clampVal(parsed)
  emit('update:modelValue', next)
  display.value = fmt(next)
}
</script>

<template>
  <div :class="['relative', paired ? 'w-paired-field' : 'flex-1 min-w-0']">
    <input
      v-model="display"
      type="text"
      inputmode="numeric"
      :disabled="disabled"
      :class="[
        'w-full h-input bg-bg-3 border border-border rounded-sm font-mono text-xs text-text-1',
        'outline-none transition-colors duration-[140ms] focus:border-accent',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        unit ? 'pl-[7px] pr-6' : 'px-[7px]',
        isFocused ? 'cursor-text' : 'cursor-ew-resize',
      ]"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    />
    <span
      v-if="unit"
      class="absolute right-[7px] top-1/2 -translate-y-1/2 text-xs text-text-3 font-mono pointer-events-none select-none"
    >{{ unit }}</span>
  </div>
</template>
