<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSaveOrchestrator } from '@/composables/useSaveOrchestrator'
import Button from '@/ui/Button.vue'
import ConflictModal from './ConflictModal.vue'

const doc                = useDocumentStore()
const { savedAt, saveNow } = useSaveOrchestrator()
const showConflictModal  = ref(false)

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)} min ago`
}

const label = computed((): string | null => {
  if (doc.location !== 'cloud') return null
  if (doc.saveStatus === 'saving' || doc.saveStatus === 'dirty') return 'Saving\u2026'
  if (doc.saveStatus === 'saved') return 'Saved'
  if (doc.saveStatus === 'clean' && savedAt.value) return `Saved \xb7 ${timeAgo(savedAt.value)}`
  if (doc.saveStatus === 'clean') return 'Saved'
  return null
})
</script>

<template>
  <template v-if="doc.location === 'cloud'">
    <Button
      v-if="doc.saveStatus === 'conflict'"
      variant="danger"
      size="sm"
      @click="showConflictModal = true"
    >
      Conflict &mdash; review
    </Button>
    <Button
      v-else-if="doc.saveStatus === 'error'"
      variant="danger"
      size="sm"
      @click="saveNow()"
    >
      Save failed &mdash; retry
    </Button>
    <Transition
      v-else
      enter-from-class="opacity-0" enter-active-class="transition-opacity duration-[140ms]"
      leave-to-class="opacity-0"   leave-active-class="transition-opacity duration-[140ms]"
    >
      <span v-if="label" class="text-[10px] text-text-4 select-none flex-shrink-0">
        {{ label }}
      </span>
    </Transition>

    <ConflictModal :show="showConflictModal" @close="showConflictModal = false" />
  </template>
</template>
