<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedElement } from '@/composables/useAnimatedElement'
import { useElementTransform } from '@/composables/useElementTransform'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useToolStore } from '@/stores/useToolStore'

const props = defineProps<{ elementId: string }>()

const t        = useElementTransform()
const animated = useAnimatedElement(() => props.elementId)
const sel      = useSelectionStore()
const toolStore = useToolStore()

function onDblClick(): void {
  const el = animated.value
  if (el?.type !== 'rect' || el.locked || !el.visible) return
  if (sel.selectedIds.length !== 1) return
  toolStore.setTool('shape-edit')
}

// Selection box in element's local unrotated space; rotation applied via <g>
const b = computed(() => {
  const el = animated.value
  if (!el) return { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, rot: 0 }
  return {
    x: el.x, y: el.y, w: el.width, h: el.height,
    cx: el.x + el.width / 2, cy: el.y + el.height / 2,
    rot: el.rotation,
  }
})

// 8 resize handles: name → [x, y] as fractions of bounds
const HANDLES = [
  { id: 'nw', fx: 0,   fy: 0   },
  { id: 'n',  fx: 0.5, fy: 0   },
  { id: 'ne', fx: 1,   fy: 0   },
  { id: 'e',  fx: 1,   fy: 0.5 },
  { id: 'se', fx: 1,   fy: 1   },
  { id: 's',  fx: 0.5, fy: 1   },
  { id: 'sw', fx: 0,   fy: 1   },
  { id: 'w',  fx: 0,   fy: 0.5 },
] as const

function handlePos(fx: number, fy: number) {
  return { x: b.value.x + fx * b.value.w, y: b.value.y + fy * b.value.h }
}

// Rotation handle sits 24px above center-top in local space
const rotHandleY = computed(() => b.value.y - 24)
</script>

<template>
  <g
    :transform="b.rot ? `rotate(${b.rot} ${b.cx} ${b.cy})` : undefined"
    style="pointer-events: none"
  >
    <!-- Selection border -->
    <rect
      :x="b.x"
      :y="b.y"
      :width="b.w"
      :height="b.h"
      fill="transparent"
      stroke="#4353ff"
      stroke-width="1"
      style="pointer-events: all; cursor: move"
      @pointerdown="t.startDrag($event, [elementId])"
      @pointermove="t.onPointerMove"
      @pointerup="t.onPointerUp"
      @dblclick.stop="onDblClick"
    />

    <!-- Resize handles -->
    <rect
      v-for="h in HANDLES"
      :key="h.id"
      :x="handlePos(h.fx, h.fy).x - 4"
      :y="handlePos(h.fx, h.fy).y - 4"
      width="8"
      height="8"
      fill="#ffffff"
      stroke="#4353ff"
      stroke-width="1"
      rx="1"
      style="pointer-events: all; cursor: nwse-resize"
      @pointerdown="t.startResize($event, h.id, elementId)"
      @pointermove="t.onPointerMove"
      @pointerup="t.onPointerUp"
    />

    <!-- Rotation handle stem -->
    <line
      :x1="b.cx"
      :y1="b.y"
      :x2="b.cx"
      :y2="rotHandleY"
      stroke="#4353ff"
      stroke-width="1"
      style="pointer-events: none"
    />

    <!-- Rotation handle circle -->
    <circle
      :cx="b.cx"
      :cy="rotHandleY"
      r="5"
      fill="#ffffff"
      stroke="#4353ff"
      stroke-width="1"
      style="pointer-events: all; cursor: crosshair"
      @pointerdown="t.startRotate($event, elementId)"
      @pointermove="t.onPointerMove"
      @pointerup="t.onPointerUp"
    />
  </g>
</template>
