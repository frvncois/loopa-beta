<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import type { PathElement } from '@/types/element'

const doc = useDocumentStore()

const isEmpty = computed(() =>
  doc.elements.filter((e) => !(e.type === 'path' && (e as PathElement).isMotionPath)).length === 0,
)
</script>

<template>
  <Transition
    enter-from-class="opacity-0"
    enter-active-class="transition-opacity duration-300"
    leave-to-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
  >
    <div
      v-if="isEmpty"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="flex flex-col items-center gap-2 text-center select-none">
        <div class="w-10 h-10 rounded-lg bg-bg-3 border border-border flex items-center justify-center mb-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="3" width="5" height="5" rx="1" fill="#4a4a5c"/>
            <rect x="10" y="3" width="5" height="5" rx="1" fill="#4a4a5c"/>
            <rect x="3" y="10" width="5" height="5" rx="1" fill="#4a4a5c"/>
            <rect x="10" y="10" width="5" height="5" rx="1" fill="#4353ff" opacity="0.6"/>
          </svg>
        </div>
        <p class="text-sm font-medium text-text-3">Drop an image or video to get started</p>
        <p class="text-xs text-text-4">Or use the toolbar on the left →</p>
      </div>
    </div>
  </Transition>
</template>
