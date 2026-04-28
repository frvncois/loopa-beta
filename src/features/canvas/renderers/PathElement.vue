<script setup lang="ts">
import { computed } from 'vue'
import type { PathElement } from '@/types/element'

const props = defineProps<{ element: PathElement }>()

// Points are stored in local (element-relative) coords.
// We use translate(x,y) to position the path, then optionally rotate around its local center.
const transform = computed(() => {
  const { x, y, rotation, width, height } = props.element
  const translate = `translate(${x} ${y})`
  const rotate = rotation ? ` rotate(${rotation} ${width / 2} ${height / 2})` : ''
  return translate + rotate
})
</script>

<template>
  <path
    v-if="!element.isMotionPath"
    :data-element-id="element.id"
    :d="element.d"
    :transform="transform"
    :fill="element.fills[0]?.visible ? '#' + element.fills[0].color : 'none'"
    :fill-opacity="element.fills[0]?.opacity ?? 1"
    :fill-rule="element.fillRule"
    :stroke="element.strokes[0]?.visible ? '#' + element.strokes[0].color : 'none'"
    :stroke-width="element.strokes[0]?.width ?? 0"
    :opacity="element.opacity"
  />
</template>
