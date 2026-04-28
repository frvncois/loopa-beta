<script setup lang="ts">
import UserMenu from '@/features/dashboard/UserMenu.vue'
</script>

<template>
  <header class="h-topbar flex-shrink-0 flex items-center px-4 gap-4 bg-bg-2 border-b border-border">
    <RouterLink to="/dashboard" class="flex items-center gap-2 select-none group">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 text-accent">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.15"/>
        <path d="M5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" fill="currentColor"/>
      </svg>
      <span class="text-xs font-semibold text-text-2 group-hover:text-text-1 transition-colors duration-[140ms]">
        Loopa
      </span>
    </RouterLink>

    <div class="flex-1" />

    <UserMenu />
  </header>
</template>
