<script setup lang="ts">
import Toggle from '@/ui/Toggle.vue'
</script>

<template>
  <div class="bg-bg-1 border border-border rounded-lg overflow-hidden">
    <div class="px-5 py-3.5 border-b border-border">
      <h2 class="text-sm font-semibold text-text-1">Notifications</h2>
      <p class="text-[11px] text-text-4 mt-0.5">More notifications coming soon. Billing receipts are always sent.</p>
    </div>

    <div class="px-5 py-4 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-text-2">Project transfer requests</p>
          <p class="text-[10px] text-text-4">Email when someone transfers a project to you</p>
        </div>
        <Toggle :model-value="false" :disabled="true" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-text-2">Billing receipts</p>
          <p class="text-[10px] text-text-4">Always sent — cannot be disabled</p>
        </div>
        <Toggle :model-value="true" :disabled="true" />
      </div>
    </div>
  </div>
</template>
