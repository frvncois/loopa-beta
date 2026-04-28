<script setup lang="ts">
import { ref, nextTick, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useOwnershipTransfers } from '@/composables/useOwnershipTransfers'
import ContextMenu from '@/ui/ContextMenu.vue'
import type { ContextMenuItem } from '@/ui/ContextMenu.vue'
import type { CloudProjectMeta } from '@/types/cloud'

const props = defineProps<{ project: CloudProjectMeta }>()

const emit = defineEmits<{
  rename:    [id: string, name: string]
  duplicate: [slug: string]
  trash:     [id: string]
}>()

const router    = useRouter()
const transfers = useOwnershipTransfers()
const menuOpen  = ref(false)
const menuX     = ref(0)
const menuY     = ref(0)
const isEditing = ref(false)
const editName  = ref('')
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')

function onCardClick() {
  if (isEditing.value) return
  router.push(`/app/${props.project.slug}`)
}

function openMenuAt(x: number, y: number) {
  menuX.value    = x
  menuY.value    = y
  menuOpen.value = true
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  openMenuAt(e.clientX, e.clientY)
}

function onMenuButtonClick(e: MouseEvent) {
  e.stopPropagation()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  openMenuAt(rect.left, rect.bottom + 4)
}

function startRename() {
  editName.value  = props.project.name
  isEditing.value = true
  nextTick(() => nameInput.value?.select())
}

function submitRename() {
  const n = editName.value.trim()
  if (n && n !== props.project.name) emit('rename', props.project.id, n)
  isEditing.value = false
}

function cancelRename() {
  isEditing.value = false
}

const menuItems: ContextMenuItem[] = [
  { label: 'Rename',    action: startRename },
  { label: 'Duplicate', action: () => emit('duplicate', props.project.slug) },
  { label: 'Transfer ownership', action: () => transfers.openTransferModal(props.project.id, props.project.name) },
  { label: '', separator: true },
  { label: 'Move to trash', danger: true, action: () => emit('trash', props.project.id) },
]

function formatDate(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000)       return 'just now'
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000)  return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(ms).toLocaleDateString()
}
</script>

<template>
  <div
    class="group cursor-pointer rounded-md border border-border hover:border-border-l bg-bg-2 transition-colors duration-[140ms] overflow-hidden"
    @click="onCardClick"
    @contextmenu="onContextMenu"
  >
    <!-- Thumbnail -->
    <div class="aspect-[16/10] bg-bg-3 overflow-hidden">
      <img
        v-if="project.thumbnailUrl"
        :src="project.thumbnailUrl"
        :alt="project.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-bg-5">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-3 py-2.5 flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <input
          v-if="isEditing"
          ref="nameInput"
          v-model="editName"
          type="text"
          class="w-full h-input bg-bg-3 border border-accent rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none"
          @keydown.enter="submitRename"
          @keydown.escape="cancelRename"
          @blur="submitRename"
          @click.stop
        />
        <p v-else class="text-xs font-medium text-text-1 truncate leading-snug">
          {{ project.name }}
        </p>
        <p class="text-[10px] text-text-4 mt-0.5">{{ formatDate(project.updatedAt) }}</p>
      </div>

      <!-- Context menu trigger -->
      <button
        type="button"
        class="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-text-4 hover:text-text-1 hover:bg-bg-4 opacity-0 group-hover:opacity-100 transition-all duration-[140ms] mt-0.5"
        title="Options"
        @click="onMenuButtonClick"
      >
        <svg width="12" height="3" viewBox="0 0 12 3" fill="currentColor">
          <circle cx="1.5" cy="1.5" r="1.5"/><circle cx="6" cy="1.5" r="1.5"/><circle cx="10.5" cy="1.5" r="1.5"/>
        </svg>
      </button>
    </div>
  </div>

  <ContextMenu
    :show="menuOpen"
    :x="menuX"
    :y="menuY"
    :items="menuItems"
    @close="menuOpen = false"
  />
</template>
