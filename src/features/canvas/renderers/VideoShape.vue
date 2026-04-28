<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTemplateRef } from 'vue'
import { useMediaUrl } from '@/composables/useMediaUrl'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { VideoElement } from '@/types/element'

const props = defineProps<{ element: VideoElement }>()

const tl = useTimelineStore()
const storageId = computed(() => props.element.videoStorageId)
const { url } = useMediaUrl(storageId)

const videoRef = useTemplateRef<HTMLVideoElement>('video')

const transform = computed(() => {
  const { x, y, rotation, width, height } = props.element
  return rotation
    ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})`
    : undefined
})

function targetTime(): number {
  const { trimStart, trimEnd, playbackRate } = props.element
  const t = trimStart + (tl.currentFrame / tl.fps) * playbackRate
  return Math.max(trimStart, Math.min(trimEnd, t))
}

let lastScrubMs = 0

watch(
  () => tl.isPlaying,
  (playing) => {
    const v = videoRef.value
    if (!v || !url.value) return
    if (playing) {
      v.currentTime = targetTime()
      v.playbackRate = props.element.playbackRate
      void v.play()
    } else {
      v.pause()
    }
  },
)

watch(
  () => tl.currentFrame,
  () => {
    if (tl.isPlaying) return
    const now = performance.now()
    if (now - lastScrubMs < 16) return
    lastScrubMs = now
    const v = videoRef.value
    if (!v) return
    v.currentTime = targetTime()
  },
)

watch(url, (newUrl) => {
  if (!newUrl) return
  const v = videoRef.value
  if (!v) return
  v.currentTime = targetTime()
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

  <!-- Loaded video -->
  <g v-else :transform="transform">
    <foreignObject
      :data-element-id="element.id"
      :x="element.x"
      :y="element.y"
      :width="element.width"
      :height="element.height"
      :opacity="element.opacity"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; overflow: hidden;">
        <video
          ref="video"
          :src="url"
          playsinline
          muted
          preload="metadata"
          :style="{
            width: '100%',
            height: '100%',
            objectFit: element.fit,
            display: 'block',
            pointerEvents: 'none',
          }"
        />
      </div>
    </foreignObject>
  </g>
</template>
