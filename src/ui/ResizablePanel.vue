<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  side: 'left' | 'right' | 'bottom'
  min: number
  max: number
  defaultSize: number
  storageKey?: string
}>()

function readStored(): number {
  if (!props.storageKey) return props.defaultSize
  const v = localStorage.getItem(props.storageKey)
  return v ? Math.min(props.max, Math.max(props.min, Number(v))) : props.defaultSize
}

const size = ref(readStored())

const isVertical = computed(() => props.side === 'bottom')

const panelStyle = computed(() =>
  isVertical.value
    ? { height: `${size.value}px`, minHeight: `${props.min}px`, maxHeight: `${props.max}px` }
    : { width: `${size.value}px`, minWidth: `${props.min}px`, maxWidth: `${props.max}px` },
)

// ── Drag splitter ────────────────────────────────────────────────────────
let dragStartPos = 0
let dragStartSize = 0

function onSplitterPointerDown(e: PointerEvent) {
  e.preventDefault()
  dragStartPos = isVertical.value ? e.clientY : e.clientX
  dragStartSize = size.value
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onSplitterPointerMove(e: PointerEvent) {
  if (!(e.buttons & 1)) return
  const pos = isVertical.value ? e.clientY : e.clientX
  const delta = pos - dragStartPos
  const dir = props.side === 'right' || props.side === 'bottom' ? -1 : 1
  const next = Math.min(props.max, Math.max(props.min, dragStartSize + delta * dir))
  size.value = next
  if (props.storageKey) localStorage.setItem(props.storageKey, String(next))
}
</script>

<template>
  <div
    :style="panelStyle"
    :class="['relative flex-shrink-0', isVertical ? 'flex flex-col' : 'flex flex-row']"
  >
    <!-- Splitter handle -->
    <div
      :class="[
        'absolute z-10 bg-transparent hover:bg-accent/20 transition-colors duration-[140ms]',
        side === 'left'   && 'top-0 right-0 w-1 h-full cursor-col-resize',
        side === 'right'  && 'top-0 left-0 w-1 h-full cursor-col-resize',
        side === 'bottom' && 'top-0 left-0 right-0 h-1 cursor-row-resize',
      ]"
      @pointerdown="onSplitterPointerDown"
      @pointermove="onSplitterPointerMove"
    />
    <slot />
  </div>
</template>
