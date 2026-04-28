<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBilling } from '@/composables/useBilling'
import StorageUsageBar from '@/features/upgrade/StorageUsageBar.vue'
import Button from '@/ui/Button.vue'

const auth    = useAuthStore()
const { startCheckout, openCustomerPortal } = useBilling()
const working = ref(false)

const plan   = computed(() => auth.profile?.plan ?? 'free')
const isPro  = computed(() => plan.value === 'pro')
const status = computed(() => auth.profile?.subscriptionStatus)

const periodEnd = computed(() => {
  const ts = auth.profile?.subscriptionPeriodEnd
  if (!ts) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(ts))
})

async function upgrade(): Promise<void> {
  working.value = true
  try { await startCheckout('monthly') }
  catch { working.value = false }
}

async function manageSubscription(): Promise<void> {
  working.value = true
  try { await openCustomerPortal() }
  catch { working.value = false }
}
</script>

<template>
  <div class="bg-bg-1 border border-border rounded-lg overflow-hidden">
    <div class="px-5 py-3.5 border-b border-border flex items-center gap-3">
      <h2 class="text-sm font-semibold text-text-1">Plan</h2>
      <span
        :class="[
          'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wide',
          isPro ? 'bg-accent text-white' : 'bg-bg-4 text-text-3',
        ]"
      >
        {{ isPro ? 'Pro' : 'Free' }}
      </span>
    </div>

    <div class="px-5 py-4 flex flex-col gap-4">
      <StorageUsageBar />

      <!-- Cancellation notice for Pro users who have canceled -->
      <p
        v-if="isPro && status === 'canceled' && periodEnd"
        class="text-xs text-warning"
      >
        Your Pro plan is active until {{ periodEnd }}, then reverts to Free.
      </p>

      <div class="flex items-center gap-2">
        <Button
          v-if="!isPro"
          variant="accent"
          size="sm"
          :disabled="working"
          @click="upgrade"
        >
          {{ working ? 'Redirecting\u2026' : 'Upgrade to Pro \u2014 $5/mo' }}
        </Button>
        <Button
          v-else
          variant="default"
          size="sm"
          :disabled="working"
          @click="manageSubscription"
        >
          {{ working ? 'Redirecting\u2026' : 'Manage subscription' }}
        </Button>
      </div>
    </div>
  </div>
</template>
