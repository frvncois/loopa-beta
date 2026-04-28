<script setup lang="ts">
import { useMarquee } from '@/features/canvas/composables/useMarquee'
const { marquee } = useMarquee()
</script>

<template>
  <rect
    v-if="marquee"
    :x="marquee.x"
    :y="marquee.y"
    :width="Math.abs(marquee.width)"
    :height="Math.abs(marquee.height)"
    fill="rgb(67 83 255 / 0.08)"
    stroke="#4353ff"
    stroke-width="1"
    stroke-dasharray="4 3"
    style="pointer-events: none"
  />
</template>
