<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'

export interface ContextMenuItem {
  label: string
  shortcut?: string
  action?: () => void
  separator?: boolean
  danger?: boolean
  disabled?: boolean
}

const props = defineProps<{
  show: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{ close: [] }>()

// Flip if near viewport edge
const menuStyle = computed(() => {
  const menuW = 180
  const menuH = props.items.length * 28 + 8
  const left = props.x + menuW > window.innerWidth ? props.x - menuW : props.x
  const top = props.y + menuH > window.innerHeight ? props.y - menuH : props.y
  return { left: `${left}px`, top: `${top}px` }
})

function onClickOutside() { emit('close') }

function activate(item: ContextMenuItem) {
  if (item.disabled || item.separator) return
  item.action?.()
  emit('close')
}

onMounted(() => document.addEventListener('mousedown', onClickOutside, true))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside, true))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      :style="menuStyle"
      class="fixed z-[9999] bg-bg-2 border border-border-l rounded-md shadow-xl py-1 min-w-[160px]"
    >
      <template v-for="(item, i) in items" :key="i">
        <div v-if="item.separator" class="h-px bg-border my-1 mx-1" />
        <button
          v-else
          type="button"
          :disabled="item.disabled"
          :class="[
            'w-full flex items-center gap-2 h-7 px-3 text-xs transition-colors duration-[140ms]',
            item.danger ? 'text-danger hover:bg-danger-soft' : 'text-text-2 hover:bg-bg-4 hover:text-text-1',
            item.disabled && 'opacity-40 cursor-not-allowed',
          ]"
          @click="activate(item)"
        >
          <span class="flex-1 text-left">{{ item.label }}</span>
          <span v-if="item.shortcut" class="text-text-4 font-mono">{{ item.shortcut }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>
