<script setup lang="ts">
import { computed } from 'vue'
import { useMediaUrl } from '@/composables/useMediaUrl'
import type { ImageElement } from '@/types/element'

const props = defineProps<{ element: ImageElement }>()

const storageId = computed(() => props.element.imageStorageId)
const { url } = useMediaUrl(storageId)

const clipId = computed(() => `img-clip-${props.element.id}`)

const transform = computed(() => {
  const { x, y, rotation, width, height } = props.element
  return rotation
    ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})`
    : undefined
})

const preserveAspectRatio = computed(() => {
  switch (props.element.objectFit) {
    case 'cover':   return 'xMidYMid slice'
    case 'fill':    return 'none'
    default:        return 'xMidYMid meet'
  }
})
</script>

<template>
  <!-- Placeholder while loading -->
  <g v-if="!url">
    <rect
      :data-element-id="element.id"
      :x="element.x"
      :y="element.y"
      :width="element.width"
      :height="element.height"
      fill="#1c1c26"
      :opacity="element.opacity"
      :transform="transform"
    />
    <text
      :x="element.x + element.width / 2"
      :y="element.y + element.height / 2"
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="11"
      font-family="DM Sans, sans-serif"
      fill="#4a4a5c"
      style="pointer-events: none"
    >Loading…</text>
  </g>

  <!-- Loaded image -->
  <g v-else :transform="transform">
    <defs v-if="element.objectFit === 'cover'">
      <clipPath :id="clipId">
        <rect :x="element.x" :y="element.y" :width="element.width" :height="element.height" />
      </clipPath>
    </defs>
    <image
      :data-element-id="element.id"
      :href="url"
      :x="element.x"
      :y="element.y"
      :width="element.width"
      :height="element.height"
      :preserveAspectRatio="preserveAspectRatio"
      :clip-path="element.objectFit === 'cover' ? `url(#${clipId})` : undefined"
      :opacity="element.opacity"
    />
  </g>
</template>
