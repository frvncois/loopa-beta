<script setup lang="ts">
import type { TextElement } from '@/types/element'
defineProps<{ element: TextElement }>()
</script>

<template>
  <text
    :data-element-id="element.id"
    :x="element.x"
    :y="element.y + element.fontSize"
    :transform="element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined"
    :font-size="element.fontSize"
    :font-family="element.fontFamily"
    :font-weight="element.fontWeight"
    :text-anchor="element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start'"
    :fill="element.fills[0]?.visible ? '#' + element.fills[0].color : '#ededf0'"
    :opacity="element.opacity"
  >{{ element.text }}</text>
</template>
