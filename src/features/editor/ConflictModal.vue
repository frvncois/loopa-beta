<script setup lang="ts">
import { useSaveOrchestrator } from '@/composables/useSaveOrchestrator'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { reloadFromServer, overwriteServer } = useSaveOrchestrator()

async function reload() {
  emit('close')
  await reloadFromServer()
}

async function overwrite() {
  emit('close')
  await overwriteServer()
}
</script>

<template>
  <Modal :show="show" title="Conflict detected" width="400px" @close="$emit('close')">
    <p class="text-xs text-text-3 mb-4 leading-relaxed">
      This project was saved from another tab or device while you were editing.
      Choose how to resolve:
    </p>

    <template #footer>
      <Button variant="ghost" size="sm" @click="$emit('close')">Keep editing</Button>
      <Button variant="danger" size="sm" @click="reload">Reload server version</Button>
      <Button variant="default" size="sm" @click="overwrite">Overwrite server</Button>
    </template>
  </Modal>
</template>
