<script setup lang="ts">
import Modal from '@/ui/Modal.vue'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const GROUPS = [
  {
    title: 'Tools',
    rows: [
      ['V', 'Select'],
      ['H', 'Hand / Pan'],
      ['R', 'Rectangle'],
      ['E', 'Ellipse'],
      ['L', 'Line'],
      ['N', 'Polygon'],
      ['S', 'Star'],
      ['T', 'Text'],
      ['P', 'Pen'],
      ['M', 'Motion Path'],
      ['Space (hold)', 'Temporary hand'],
    ],
  },
  {
    title: 'Edit',
    rows: [
      ['⌘Z', 'Undo'],
      ['⌘⇧Z', 'Redo'],
      ['⌘D', 'Duplicate'],
      ['⌘G', 'Group'],
      ['⌘⇧G', 'Ungroup'],
      ['⌘C', 'Copy'],
      ['⌘X', 'Cut'],
      ['⌘V', 'Paste'],
      ['K', 'Add keyframe'],
      ['Delete / ⌫', 'Delete selection'],
      ['Arrow keys', 'Nudge 1px'],
      ['⇧ + Arrow', 'Nudge 10px'],
    ],
  },
  {
    title: 'View',
    rows: [
      ['+', 'Zoom in'],
      ['-', 'Zoom out'],
      ['⌘0', 'Reset view'],
      ['⌘1', 'Fit to view'],
      ['⌘/', 'This dialog'],
      ['⌘,', 'Project settings'],
    ],
  },
  {
    title: 'File',
    rows: [
      ['⌘S', 'Save'],
    ],
  },
]
</script>

<template>
  <Modal :show="show" title="Keyboard Shortcuts" width="480px" @close="$emit('close')">
    <div class="grid grid-cols-2 gap-x-6 gap-y-4">
      <div v-for="group in GROUPS" :key="group.title">
        <p class="text-[10px] font-semibold text-text-4 uppercase tracking-widest mb-2">{{ group.title }}</p>
        <div v-for="[key, label] in group.rows" :key="key" class="flex items-center justify-between h-6">
          <span class="text-xs text-text-2">{{ label }}</span>
          <kbd class="text-[10px] font-mono text-text-3 bg-bg-4 border border-border px-1.5 py-0.5 rounded-sm">{{ key }}</kbd>
        </div>
      </div>
    </div>
  </Modal>
</template>
