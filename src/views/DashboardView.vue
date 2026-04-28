<script setup lang="ts">
import AppShell from '@/layout/AppShell.vue'
import ProjectGrid from '@/features/dashboard/ProjectGrid.vue'
import IncomingTransfersBanner from '@/features/dashboard/IncomingTransfersBanner.vue'
import TransferOwnershipModal from '@/features/dashboard/TransferOwnershipModal.vue'
</script>

<template>
  <AppShell>
    <IncomingTransfersBanner />
    <ProjectGrid />
    <TransferOwnershipModal />
  </AppShell>
</template>
