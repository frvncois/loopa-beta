<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOwnershipTransfers } from '@/composables/useOwnershipTransfers'
import Button from '@/ui/Button.vue'

const route     = useRoute()
const transfers = useOwnershipTransfers()

const actionError = ref<Record<string, string>>({})
const working     = ref<Record<string, boolean>>({})

onMounted(async () => {
  await transfers.loadPending()
  // If landing from a transfer email, scroll/highlight is implicit — banner shows automatically
})

async function onAccept(transferId: string): Promise<void> {
  working.value[transferId]     = true
  actionError.value[transferId] = ''
  const result = await transfers.accept(transferId)
  if (!result.ok) {
    actionError.value[transferId] = result.error ?? 'Failed to accept'
    working.value[transferId]     = false
  }
}

async function onDecline(transferId: string): Promise<void> {
  working.value[transferId]     = true
  actionError.value[transferId] = ''
  const result = await transfers.decline(transferId)
  if (!result.ok) {
    actionError.value[transferId] = result.error ?? 'Failed to decline'
    working.value[transferId]     = false
  }
}

function senderLabel(fromEmail: string): string {
  return fromEmail || 'Someone'
}
</script>

<template>
  <div v-if="transfers.pending.value.length > 0" class="flex flex-col gap-2 px-8 pt-5">
    <div
      v-for="transfer in transfers.pending.value"
      :key="transfer.id"
      class="flex items-start gap-3 bg-bg-2 border border-border rounded-md px-4 py-3"
      :class="{ 'border-accent/40': route.query.transfer === transfer.id }"
    >
      <div class="flex-1 min-w-0">
        <p class="text-xs text-text-2 leading-snug">
          <span class="text-text-1 font-medium">{{ senderLabel(transfer.fromEmail) }}</span>
          wants to transfer
          <span class="text-text-1 font-medium">&ldquo;{{ transfer.projectName }}&rdquo;</span>
          to you.
        </p>
        <p v-if="actionError[transfer.id]" class="text-[10px] text-danger mt-1">
          {{ actionError[transfer.id] }}
        </p>
        <p class="text-[10px] text-text-4 mt-0.5">
          Expires {{ new Date(transfer.expiresAt).toLocaleDateString() }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          :disabled="working[transfer.id]"
          @click="onDecline(transfer.id)"
        >
          Decline
        </Button>
        <Button
          variant="accent"
          size="sm"
          :disabled="working[transfer.id]"
          @click="onAccept(transfer.id)"
        >
          {{ working[transfer.id] ? 'Working\u2026' : 'Accept' }}
        </Button>
      </div>
    </div>
  </div>
</template>
