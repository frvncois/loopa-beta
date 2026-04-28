<script setup lang="ts">
import { computed } from 'vue'
import type { GroupElement } from '@/types/element'
import ElementRenderer from './ElementRenderer.vue'
import ClipShapeRenderer from './ClipShapeRenderer.vue'

const props = defineProps<{ element: GroupElement }>()

const rotate = computed(() =>
  props.element.rotation
    ? `rotate(${props.element.rotation} ${props.element.x + props.element.width / 2} ${props.element.y + props.element.height / 2})`
    : undefined,
)
const clipId = computed(() => `mask-${props.element.id}`)
const maskShapeId = computed(() => props.element.hasMask ? props.element.childIds[0] : undefined)
const contentIds = computed(() =>
  props.element.hasMask ? props.element.childIds.slice(1) : props.element.childIds,
)
</script>

<template>
  <!-- Mask group: childIds[0] defines the clip region, rest are clipped content -->
  <g
    v-if="element.hasMask"
    :data-element-id="element.id"
    :transform="rotate"
    :opacity="element.opacity"
  >
    <defs>
      <clipPath :id="clipId">
        <ClipShapeRenderer v-if="maskShapeId" :element-id="maskShapeId" />
      </clipPath>
    </defs>
    <g :clip-path="`url(#${clipId})`">
      <ElementRenderer
        v-for="childId in contentIds"
        :key="childId"
        :element-id="childId"
      />
    </g>
  </g>

  <!-- Regular group -->
  <g
    v-else
    :data-element-id="element.id"
    :transform="rotate"
    :opacity="element.opacity"
  >
    <ElementRenderer
      v-for="childId in element.childIds"
      :key="childId"
      :element-id="childId"
    />
  </g>
</template>
