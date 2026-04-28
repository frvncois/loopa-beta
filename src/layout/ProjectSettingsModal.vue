<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

const props = defineProps<{ show: boolean }>()
const emit  = defineEmits<{ close: [] }>()

const doc = useDocumentStore()

const nameInput  = ref(doc.meta?.name ?? 'Untitled')
const confirming = ref(false)

// Sync name input when modal opens
watch(() => props.show, (v) => {
  if (v) { nameInput.value = doc.meta?.name ?? 'Untitled'; confirming.value = false }
})

function saveName(): void {
  if (!doc.meta) return
  const trimmed = nameInput.value.trim() || 'Untitled'
  doc.updateMeta({ name: trimmed })
  void doc.saveProject()
}

async function onDelete(): Promise<void> {
  await doc.deleteProject()
  emit('close')
}

function formatDate(ts: number | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const stats = computed(() => ({
  frames:   doc.frames.length,
  elements: doc.elements.length,
  tracks:   doc.tracks.length,
  version:  3,
}))
</script>

<template>
  <Modal :show="show" title="Project Settings" width="400px" @close="emit('close')">
    <!-- Name -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-medium text-text-3">Project name</label>
        <input
          v-model="nameInput"
          type="text"
          class="h-input bg-bg-3 border border-border rounded-sm px-[7px] font-sans text-xs text-text-1 outline-none transition-colors focus:border-accent"
          @blur="saveName"
          @keydown.enter.prevent="saveName"
        />
      </div>

      <!-- Info -->
      <div class="flex flex-col gap-1 pt-1 border-t border-border">
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Schema version</span>
          <span class="text-text-2 font-mono">{{ stats.version }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Created</span>
          <span class="text-text-2">{{ formatDate(doc.meta?.createdAt) }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Last saved</span>
          <span class="text-text-2">{{ formatDate(doc.meta?.updatedAt) }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Frames</span>
          <span class="text-text-2 font-mono">{{ stats.frames }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Elements</span>
          <span class="text-text-2 font-mono">{{ stats.elements }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-text-3">Animation tracks</span>
          <span class="text-text-2 font-mono">{{ stats.tracks }}</span>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="pt-1 border-t border-border">
        <p class="text-[10px] font-semibold text-text-4 uppercase tracking-widest mb-2">Danger zone</p>
        <div v-if="!confirming" class="flex">
          <button
            type="button"
            class="h-input-sm px-3 text-xs text-danger border border-danger/40 rounded-sm hover:bg-danger-soft hover:border-danger transition-colors duration-[140ms]"
            @click="confirming = true"
          >
            Delete project
          </button>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-xs text-text-2 flex-1">This cannot be undone.</span>
          <Button variant="default" @click="confirming = false">Cancel</Button>
          <Button variant="danger" @click="onDelete">Delete</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
