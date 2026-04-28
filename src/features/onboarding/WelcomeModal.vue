<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

const STORAGE_KEY = 'loopa.welcomed'

const show = ref(!localStorage.getItem(STORAGE_KEY))

function dismiss(): void {
  localStorage.setItem(STORAGE_KEY, '1')
  show.value = false
}

const shortcuts = [
  { key: 'R',          label: 'Draw rectangles' },
  { key: 'P',          label: 'Pen tool' },
  { key: 'Space+drag', label: 'Pan the canvas' },
]
</script>

<template>
  <Modal :show="show" width="380px" @close="dismiss">
    <div class="flex flex-col gap-5">
      <div>
        <h2 class="text-sm font-semibold text-text-1 mb-1">Welcome to Loopa</h2>
        <p class="text-xs text-text-3 leading-relaxed">
          A browser-based animation tool for SVG and motion graphics — draw shapes, set keyframes, export to Lottie or video.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <div
          v-for="s in shortcuts"
          :key="s.key"
          class="flex items-center gap-3 h-7"
        >
          <kbd class="inline-flex items-center justify-center min-w-[52px] h-5 px-1.5 bg-bg-3 border border-border rounded text-[10px] font-mono text-text-2 font-medium">
            {{ s.key }}
          </kbd>
          <span class="text-xs text-text-3">{{ s.label }}</span>
        </div>
      </div>

      <p class="text-[10px] text-text-4">
        You can revisit shortcuts anytime with
        <kbd class="inline-flex items-center justify-center w-4 h-4 bg-bg-3 border border-border rounded text-[9px] font-mono align-middle">?</kbd>
      </p>
    </div>

    <template #footer>
      <Button variant="accent" size="sm" @click="dismiss">Got it</Button>
    </template>
  </Modal>
</template>
