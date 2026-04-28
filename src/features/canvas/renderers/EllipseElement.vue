<script setup lang="ts">
import type { EllipseElement } from '@/types/element'
defineProps<{ element: EllipseElement }>()
</script>

<template>
  <ellipse
    :data-element-id="element.id"
    :cx="element.x + element.width / 2"
    :cy="element.y + element.height / 2"
    :rx="element.width / 2"
    :ry="element.height / 2"
    :transform="element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined"
    :fill="element.fills[0]?.visible ? '#' + element.fills[0].color : 'none'"
    :fill-opacity="element.fills[0]?.opacity ?? 1"
    :stroke="element.strokes[0]?.visible ? '#' + element.strokes[0].color : 'none'"
    :stroke-width="element.strokes[0]?.width ?? 0"
    :opacity="element.opacity"
  />
</template>
