<script setup lang="ts">
import { computed } from 'vue'
import type { PolygonElement } from '@/types/element'

const props = defineProps<{ element: PolygonElement }>()

const points = computed(() => {
  const { x, y, width, height, sides } = props.element
  const cx = x + width / 2
  const cy = y + height / 2
  const rx = width / 2
  const ry = height / 2
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
    pts.push(`${cx + Math.cos(angle) * rx},${cy + Math.sin(angle) * ry}`)
  }
  return pts.join(' ')
})
</script>

<template>
  <polygon
    :data-element-id="element.id"
    :points="points"
    :transform="element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined"
    :fill="element.fills[0]?.visible ? '#' + element.fills[0].color : 'none'"
    :fill-opacity="element.fills[0]?.opacity ?? 1"
    :stroke="element.strokes[0]?.visible ? '#' + element.strokes[0].color : 'none'"
    :stroke-width="element.strokes[0]?.width ?? 0"
    :opacity="element.opacity"
  />
</template>
