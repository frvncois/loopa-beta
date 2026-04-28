<script setup lang="ts">
import { computed } from 'vue'
import type { StarElement } from '@/types/element'

const props = defineProps<{ element: StarElement }>()

const points = computed(() => {
  const { x, y, width, height, starPoints, innerRadius } = props.element
  const cx = x + width / 2
  const cy = y + height / 2
  const outerRx = width / 2
  const outerRy = height / 2
  const innerRx = outerRx * innerRadius
  const innerRy = outerRy * innerRadius
  const pts: string[] = []
  const total = starPoints * 2
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2
    const rx = i % 2 === 0 ? outerRx : innerRx
    const ry = i % 2 === 0 ? outerRy : innerRy
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
