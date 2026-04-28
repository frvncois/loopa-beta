<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  width?: string
}>()

const emit = defineEmits<{ close: [] }>()

function onKeyDown(e: KeyboardEvent) {
  if (props.show && e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity duration-[140ms]"
      leave-to-class="opacity-0"
      leave-active-class="transition-opacity duration-[140ms]"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[8000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="$emit('close')"
      >
        <div
          :style="width ? { width } : {}"
          class="bg-bg-2 border border-border-l rounded-lg shadow-2xl flex flex-col min-w-[320px] max-w-[90vw] max-h-[80vh]"
        >
          <div v-if="title || $slots.header" class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <span class="text-sm font-semibold text-text-1">{{ title }}</span>
            <slot name="header-actions" />
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
