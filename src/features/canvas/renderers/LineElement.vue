<script setup lang="ts">
import type { LineElement } from '@/types/element'
defineProps<{ element: LineElement }>()
</script>

<template>
  <line
    :data-element-id="element.id"
    :x1="element.x"
    :y1="element.y"
    :x2="element.x + element.width"
    :y2="element.y"
    :transform="element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y})` : undefined"
    :stroke="element.strokes[0]?.visible ? '#' + element.strokes[0].color : '#ededf0'"
    :stroke-width="element.strokes[0]?.width ?? 2"
    :opacity="element.opacity"
  />
</template>
