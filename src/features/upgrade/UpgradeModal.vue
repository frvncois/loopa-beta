<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useBilling } from '@/composables/useBilling'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'

const limits  = usePlanLimits()
const { startCheckout } = useBilling()
const show    = computed(() => limits.upgradeModalVariant.value !== null)
const working = ref(false)

const headline = computed(() =>
  limits.upgradeModalVariant.value === 'storage'
    ? 'You\u2019ve reached your storage limit'
    : 'You\u2019ve used all 3 free projects'
)

const body = computed(() =>
  limits.upgradeModalVariant.value === 'storage'
    ? 'Your 1 GB free storage is full. Upgrade to Pro for 10 GB.'
    : 'Free accounts can have up to 3 active projects. Upgrade to Pro for unlimited projects.'
)

async function upgrade(): Promise<void> {
  working.value = true
  try {
    await startCheckout('monthly')
    // redirect happens inside startCheckout; if we reach here it failed silently
  } catch {
    working.value = false
  }
}
</script>

<template>
  <Modal :show="show" title="Upgrade to Pro" width="420px" @close="limits.hideUpgradeModal()">
    <p class="text-sm font-semibold text-text-1 mb-1">{{ headline }}</p>
    <p class="text-xs text-text-3 mb-5 leading-relaxed">{{ body }}</p>

    <div class="flex flex-col gap-2 mb-2">
      <div class="flex items-center gap-2 text-xs text-text-2">
        <span class="w-3.5 h-3.5 rounded-full bg-accent flex-shrink-0" />
        Unlimited projects
      </div>
      <div class="flex items-center gap-2 text-xs text-text-2">
        <span class="w-3.5 h-3.5 rounded-full bg-accent flex-shrink-0" />
        10 GB storage
      </div>
      <div class="flex items-center gap-2 text-xs text-text-2">
        <span class="w-3.5 h-3.5 rounded-full bg-accent flex-shrink-0" />
        Priority support
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" size="sm" :disabled="working" @click="limits.hideUpgradeModal()">Maybe later</Button>
      <Button variant="accent" size="sm" :disabled="working" @click="upgrade()">
        {{ working ? 'Redirecting\u2026' : 'Upgrade to Pro \u2014 $5/mo' }}
      </Button>
    </template>
  </Modal>
</template>
