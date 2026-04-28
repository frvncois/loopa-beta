<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'

defineProps<{
  show: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Modal :show="show" :title="title ?? 'Confirm'" width="360px" @close="$emit('cancel')">
    <p class="text-sm text-text-2">{{ message }}</p>
    <template #footer>
      <Button variant="ghost" size="sm" @click="$emit('cancel')">
        {{ cancelLabel ?? 'Cancel' }}
      </Button>
      <Button :variant="danger ? 'danger' : 'accent'" size="sm" @click="$emit('confirm')">
        {{ confirmLabel ?? 'Confirm' }}
      </Button>
    </template>
  </Modal>
</template>
