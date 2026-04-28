<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedElement } from '@/composables/useAnimatedElement'

const props = defineProps<{ elementId: string }>()
const animated = useAnimatedElement(() => props.elementId)

// Pre-compute everything in script so template stays type-safe.
const shape = computed(() => {
  const el = animated.value
  if (!el) return null

  const rot = el.rotation
    ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})`
    : undefined

  if (el.type === 'rect') {
    return {
      kind: 'rect' as const,
      x: el.x, y: el.y, w: el.width, h: el.height,
      rx: el.radiusTopLeft || el.rx,
      transform: rot,
    }
  }

  if (el.type === 'ellipse') {
    return {
      kind: 'ellipse' as const,
      cx: el.x + el.width / 2, cy: el.y + el.height / 2,
      rx: el.width / 2, ry: el.height / 2,
      transform: rot,
    }
  }

  if (el.type === 'path') {
    const t = `translate(${el.x} ${el.y})`
      + (el.rotation ? ` rotate(${el.rotation} ${el.width / 2} ${el.height / 2})` : '')
    return { kind: 'path' as const, d: el.d, fillRule: el.fillRule, transform: t }
  }

  if (el.type === 'polygon') {
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2
    const rx = el.width / 2, ry = el.height / 2
    const pts: string[] = []
    for (let i = 0; i < el.sides; i++) {
      const a = (Math.PI * 2 * i) / el.sides - Math.PI / 2
      pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`)
    }
    return { kind: 'polygon' as const, points: pts.join(' '), transform: rot }
  }

  if (el.type === 'star') {
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2
    const outerRx = el.width / 2, outerRy = el.height / 2
    const innerRx = outerRx * el.innerRadius, innerRy = outerRy * el.innerRadius
    const total = el.starPoints * 2
    const pts: string[] = []
    for (let i = 0; i < total; i++) {
      const a = (Math.PI * 2 * i) / total - Math.PI / 2
      const rx = i % 2 === 0 ? outerRx : innerRx
      const ry = i % 2 === 0 ? outerRy : innerRy
      pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`)
    }
    return { kind: 'star' as const, points: pts.join(' '), transform: rot }
  }

  // Fallback: bounding rect (covers group, image, video, text, line)
  return { kind: 'fallback' as const, x: el.x, y: el.y, w: el.width, h: el.height }
})
</script>

<template>
  <g v-if="shape">
    <rect
      v-if="shape.kind === 'rect'"
      :x="shape.x" :y="shape.y" :width="shape.w" :height="shape.h"
      :rx="shape.rx" :transform="shape.transform"
      style="fill: black; stroke: none"
    />
    <ellipse
      v-else-if="shape.kind === 'ellipse'"
      :cx="shape.cx" :cy="shape.cy" :rx="shape.rx" :ry="shape.ry"
      :transform="shape.transform"
      style="fill: black; stroke: none"
    />
    <path
      v-else-if="shape.kind === 'path'"
      :d="shape.d" :fill-rule="shape.fillRule" :transform="shape.transform"
      style="fill: black; stroke: none"
    />
    <polygon
      v-else-if="shape.kind === 'polygon' || shape.kind === 'star'"
      :points="shape.points" :transform="shape.transform"
      style="fill: black; stroke: none"
    />
    <rect
      v-else
      :x="shape.x" :y="shape.y" :width="shape.w" :height="shape.h"
      style="fill: black; stroke: none"
    />
  </g>
</template>
