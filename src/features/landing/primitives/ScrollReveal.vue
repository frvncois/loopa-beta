<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const el = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!el.value) return
  observer = new IntersectionObserver(
    ([entry]) => { if (entry?.isIntersecting) { visible.value = true; observer?.disconnect() } },
    { threshold: 0.12 },
  )
  observer.observe(el.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="el"
    class="transition-all duration-[600ms] ease-out"
    :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
  >
    <slot />
  </div>
</template>
