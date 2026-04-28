<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'

const props = defineProps<{ frameId: string; isActive?: boolean }>()
const emit  = defineEmits<{ activate: [] }>()

const doc   = useDocumentStore()
const frame = computed(() => doc.frameById(props.frameId))
</script>

<template>
  <div
    v-if="frame"
    class="flex items-center gap-1.5 px-3 h-[30px] border-b border-border flex-shrink-0 cursor-pointer select-none transition-colors duration-[140ms]"
    :class="isActive ? 'bg-accent-soft' : 'bg-bg-2 hover:bg-bg-3'"
    @click="emit('activate')"
  >
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
      :class="isActive ? 'text-accent' : 'text-text-3'"
      class="flex-shrink-0 transition-colors duration-[140ms]"
    >
      <rect x="0.6" y="0.6" width="9.8" height="9.8" rx="1.2" stroke="currentColor" stroke-width="1.2" />
    </svg>
    <span
      class="flex-1 min-w-0 truncate text-xs font-semibold transition-colors duration-[140ms]"
      :class="isActive ? 'text-accent' : 'text-text-2'"
    >{{ frame.name }}</span>
    <span class="text-[10px] text-text-4 font-mono flex-shrink-0">{{ frame.width }}×{{ frame.height }}</span>
  </div>
</template>
