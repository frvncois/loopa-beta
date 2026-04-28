<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const show = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popStyle = ref<Record<string, string>>({})

function open() {
  if (!triggerRef.value) return
  const r = triggerRef.value.getBoundingClientRect()
  popStyle.value = {
    top: `${r.bottom + 4}px`,
    left: `${r.left}px`,
  }
  show.value = true
}

function close() { show.value = false }

function onClickOutside(e: MouseEvent) {
  if (show.value && triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside, true))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside, true))

defineExpose({ open, close })
</script>

<template>
  <div ref="triggerRef" class="contents">
    <slot name="trigger" :open="open" :close="close" :show="show" />
  </div>
  <Teleport to="body">
    <div
      v-if="show"
      :style="popStyle"
      class="fixed z-[9000] bg-bg-2 border border-border-l rounded-md shadow-xl min-w-[160px]"
    >
      <slot name="content" :close="close" />
    </div>
  </Teleport>
</template>
