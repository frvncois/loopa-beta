<script setup lang="ts">
import type { RectElement } from '@/types/element'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useToolStore } from '@/stores/useToolStore'

const props = defineProps<{ element: RectElement }>()
const sel      = useSelectionStore()
const toolStore = useToolStore()

function onDblClick(): void {
  if (props.element.locked || !props.element.visible) return
  if (toolStore.currentTool !== 'select') return
  sel.select(props.element.id)
  toolStore.setTool('shape-edit')
}
</script>

<template>
  <rect
    :data-element-id="element.id"
    :x="element.x"
    :y="element.y"
    :width="element.width"
    :height="element.height"
    :rx="element.radiusTopLeft || element.rx"
    :ry="element.radiusTopLeft || element.ry"
    :transform="element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined"
    :fill="element.fills[0]?.visible ? '#' + element.fills[0].color : 'none'"
    :fill-opacity="element.fills[0]?.opacity ?? 1"
    :stroke="element.strokes[0]?.visible ? '#' + element.strokes[0].color : 'none'"
    :stroke-width="element.strokes[0]?.width ?? 0"
    :opacity="element.opacity"
    @dblclick.stop="onDblClick"
  />
</template>
