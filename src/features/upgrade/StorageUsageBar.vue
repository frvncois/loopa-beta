<script setup lang="ts">
import { computed } from 'vue'
import { usePlanLimits } from '@/composables/usePlanLimits'

const limits = usePlanLimits()

const pct = computed(() =>
  limits.storageLimit.value > 0
    ? Math.min(100, (limits.storageUsed.value / limits.storageLimit.value) * 100)
    : 0
)

const barClass = computed(() => {
  if (pct.value >= 100) return 'bg-danger'
  if (pct.value >= 80)  return 'bg-warning'
  return 'bg-accent'
})

function fmt(bytes: number): string {
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <span class="text-[10px] text-text-3">Storage</span>
      <span class="text-[10px] text-text-4 font-mono">
        {{ fmt(limits.storageUsed.value) }} / {{ fmt(limits.storageLimit.value) }}
      </span>
    </div>
    <div class="h-1 bg-bg-4 rounded-full overflow-hidden">
      <div
        :class="barClass"
        class="h-full rounded-full transition-all duration-300"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>
