<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  hasActivity?: boolean
  defaultOpen?: boolean
}>()

const storageKey = `loopa.section.${props.title}`

function readStored(): boolean {
  const v = localStorage.getItem(storageKey)
  if (v !== null) return v !== 'false'
  return props.defaultOpen !== false
}

const isOpen = ref(readStored())

function toggle() {
  isOpen.value = !isOpen.value
  localStorage.setItem(storageKey, String(isOpen.value))
}
</script>

<template>
  <div class="px-3 py-2.5 border-b border-border">
    <!-- Clickable title row -->
    <button
      type="button"
      class="w-full flex items-center gap-1.5 text-xs font-semibold text-text-2 mb-0 cursor-pointer select-none hover:text-text-1 transition-colors duration-[140ms]"
      :class="isOpen ? 'mb-2' : 'mb-0'"
      @click="toggle"
    >
      <!-- Chevron -->
      <svg
        width="10" height="10" viewBox="0 0 10 10" fill="none"
        :class="['flex-shrink-0 transition-transform duration-[140ms] text-text-3', isOpen ? 'rotate-90' : '']"
      >
        <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="flex-1 text-left">{{ title }}</span>
      <!-- Activity diamond (keyframe indicator) -->
      <span
        v-if="hasActivity"
        class="w-[5px] h-[5px] bg-warning rotate-45 rounded-[1px] flex-shrink-0"
      />
    </button>
    <div v-show="isOpen">
      <slot />
    </div>
  </div>
</template>
