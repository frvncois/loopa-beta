<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

defineProps<{ text: string; side?: 'top' | 'bottom' | 'left' | 'right' }>()

const show = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tipStyle = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | null = null

function onEnter() {
  timer = setTimeout(() => {
    if (!triggerRef.value) return
    show.value = true
    const r = triggerRef.value.getBoundingClientRect()
    tipStyle.value = {
      top: `${r.bottom + 6}px`,
      left: `${r.left + r.width / 2}px`,
      transform: 'translateX(-50%)',
    }
  }, 500)
}

function onLeave() {
  if (timer) { clearTimeout(timer); timer = null }
  show.value = false
}

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <div ref="triggerRef" class="contents" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />
  </div>
  <Teleport to="body">
    <div
      v-if="show"
      :style="tipStyle"
      class="fixed z-[9999] px-2 py-1 bg-bg-5 border border-border rounded-sm text-xs text-text-2 shadow-lg pointer-events-none whitespace-nowrap"
    >
      {{ text }}
    </div>
  </Teleport>
</template>
