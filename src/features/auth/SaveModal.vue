<script setup lang="ts">
import Modal from '@/ui/Modal.vue'
import AuthForm from '@/features/auth/AuthForm.vue'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Modal :show="show" width="360px" @close="emit('close')">
    <div class="flex flex-col gap-5">
      <!-- Header -->
      <div class="flex flex-col gap-1">
        <p class="text-sm font-semibold text-text-1">Save your work</p>
        <p class="text-xs text-text-3 leading-relaxed">
          Create a free account to save this project to the cloud and access it from anywhere.
        </p>
      </div>

      <!-- Auth form -->
      <AuthForm :on-success="() => emit('close')" />
    </div>
  </Modal>
</template>
