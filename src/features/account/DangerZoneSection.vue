<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAccount } from '@/composables/useAccount'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

const auth    = useAuthStore()
const router  = useRouter()
const { deleteAccount } = useAccount()

const showModal    = ref(false)
const confirmation = ref('')
const deleting     = ref(false)
const errorMsg     = ref('')

const emailMatches = computed(
  () => confirmation.value.trim() === auth.user?.email,
)

function openModal(): void {
  confirmation.value = ''
  errorMsg.value     = ''
  showModal.value    = true
}

async function confirmDelete(): Promise<void> {
  if (!emailMatches.value) return
  deleting.value = true
  errorMsg.value = ''
  const result = await deleteAccount()
  if (result.ok) {
    router.replace('/')
  } else {
    errorMsg.value = result.error ?? 'Failed to delete account'
    deleting.value = false
  }
}
</script>

<template>
  <div class="bg-bg-1 border border-danger/30 rounded-lg overflow-hidden">
    <div class="px-5 py-3.5 border-b border-danger/30">
      <h2 class="text-sm font-semibold text-danger">Danger zone</h2>
    </div>

    <div class="px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs text-text-2">Delete account</p>
        <p class="text-[10px] text-text-4">Permanently deletes your account and all projects. Cannot be undone.</p>
      </div>
      <Button variant="danger" size="sm" @click="openModal">Delete account</Button>
    </div>

    <Modal :show="showModal" title="Delete account" width="420px" @close="showModal = false">
      <p class="text-xs text-text-3 mb-4 leading-relaxed">
        This will permanently delete your account, all your projects, and all associated media.
        <strong class="text-text-2">This cannot be undone.</strong>
      </p>

      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-text-3 font-medium">
          Type <span class="text-text-2 font-mono">{{ auth.user?.email }}</span> to confirm
        </label>
        <input
          v-model="confirmation"
          type="email"
          :placeholder="auth.user?.email"
          class="h-input w-full bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-mono outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
          @keydown.enter="emailMatches && confirmDelete()"
        />
        <p v-if="errorMsg" class="text-[10px] text-danger">{{ errorMsg }}</p>
      </div>

      <template #footer>
        <Button variant="ghost" size="sm" :disabled="deleting" @click="showModal = false">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!emailMatches || deleting"
          @click="confirmDelete"
        >
          {{ deleting ? 'Deleting\u2026' : 'Delete account' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>
