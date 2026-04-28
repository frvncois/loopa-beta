<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOwnershipTransfers } from '@/composables/useOwnershipTransfers'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

const transfers = useOwnershipTransfers()
const state     = transfers.transferModalState

const email    = ref('')
const working  = ref(false)
const errorMsg = ref('')
const sent     = ref(false)

// Reset when modal opens
watch(state, (val) => {
  if (val) {
    email.value    = ''
    errorMsg.value = ''
    working.value  = false
    sent.value     = false
  }
})

const isOpen = computed(() => state.value !== null)

function close(): void {
  if (working.value) return
  transfers.closeTransferModal()
}

async function submit(): Promise<void> {
  const addr = email.value.trim()
  if (!addr || !state.value) return
  working.value  = true
  errorMsg.value = ''
  const result = await transfers.initiateTransfer(state.value.projectId, addr)
  working.value = false
  if (result.ok) {
    sent.value = true
  } else {
    errorMsg.value = result.error ?? 'Failed to initiate transfer'
  }
}
</script>

<template>
  <Modal :show="isOpen" title="Transfer ownership" width="440px" @close="close">
    <p v-if="sent" class="text-xs text-text-2 leading-relaxed">
      Transfer initiated. <span class="text-text-1 font-medium">{{ email.trim() }}</span>
      will receive an email with instructions. They have 7 days to accept.
    </p>

    <template v-if="!sent">
      <p class="text-xs text-text-3 mb-4 leading-relaxed">
        Transfer <strong class="text-text-2">{{ state?.projectName }}</strong> to another user.
        They must have a Loopa account and will have 7 days to accept.
        <strong class="text-text-2">You will lose ownership upon acceptance.</strong>
      </p>
      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] text-text-3 font-medium">Recipient email</label>
        <input
          v-model="email"
          type="email"
          placeholder="user@example.com"
          class="h-input w-full bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
          :disabled="working"
          @keydown.enter="email.trim() && submit()"
        />
        <p v-if="errorMsg" class="text-[10px] text-danger">{{ errorMsg }}</p>
      </div>
    </template>

    <template #footer>
      <template v-if="sent">
        <Button variant="accent" size="sm" @click="close">Done</Button>
      </template>
      <template v-else>
        <Button variant="ghost" size="sm" :disabled="working" @click="close">Cancel</Button>
        <Button
          variant="accent"
          size="sm"
          :disabled="!email.trim() || working"
          @click="submit"
        >
          {{ working ? 'Sending\u2026' : 'Send transfer invite' }}
        </Button>
      </template>
    </template>
  </Modal>
</template>
