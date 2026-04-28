<script setup lang="ts">
import AppShell from '@/layout/AppShell.vue'
import ProfileSection from '@/features/account/ProfileSection.vue'
import PlanSection from '@/features/account/PlanSection.vue'
import NotificationsSection from '@/features/account/NotificationsSection.vue'
import DangerZoneSection from '@/features/account/DangerZoneSection.vue'
</script>

<template>
  <AppShell>
    <div class="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-4">
      <h1 class="text-text-1 text-base font-semibold">Account</h1>
      <ProfileSection />
      <PlanSection />
      <NotificationsSection />
      <DangerZoneSection />
    </div>
  </AppShell>
</template>
