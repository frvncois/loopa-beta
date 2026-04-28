<script setup lang="ts">
import { useDrawPreview } from '@/features/canvas/composables/useDrawPreview'
import MarqueeOverlay from '@/features/canvas/selection/MarqueeOverlay.vue'
import PenOverlay from '@/features/canvas/selection/PenOverlay.vue'
import PathPointHandles from '@/features/canvas/selection/PathPointHandles.vue'
import MotionPathOverlay from '@/features/motion-paths/MotionPathOverlay.vue'

const { preview } = useDrawPreview()
</script>

<template>
  <!-- Draw tool preview (rect/ellipse/line/etc.) -->
  <rect
    v-if="preview && (preview.type === 'rect' || preview.type === 'ellipse' || preview.type === 'line' || preview.type === 'polygon' || preview.type === 'star')"
    :x="preview.width >= 0 ? preview.x : preview.x + preview.width"
    :y="preview.height >= 0 ? preview.y : preview.y + preview.height"
    :width="Math.abs(preview.width)"
    :height="Math.abs(preview.height)"
    fill="rgb(67 83 255 / 0.15)"
    stroke="#4353ff"
    stroke-width="1"
    style="pointer-events: none"
  />

  <!-- Pen tool in-progress path -->
  <PenOverlay />

  <!-- Path edit mode: anchor & handle controls -->
  <PathPointHandles />

  <MarqueeOverlay />

  <!-- Motion path path overlays + in-progress drawing -->
  <MotionPathOverlay />
</template>
