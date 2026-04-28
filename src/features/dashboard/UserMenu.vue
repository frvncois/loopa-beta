<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const auth   = useAuthStore()
const router = useRouter()
const open   = ref(false)

function close() { open.value = false }

async function signOut() {
  close()
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 h-input px-2 rounded-sm text-xs text-text-2 hover:bg-bg-4 hover:text-text-1 transition-colors duration-[140ms]"
      @click="open = !open"
    >
      <span class="w-[18px] h-[18px] rounded-full bg-accent-soft text-accent text-[9px] font-bold flex items-center justify-center flex-shrink-0 select-none">
        {{ auth.user?.email?.[0]?.toUpperCase() ?? '?' }}
      </span>
      <span class="truncate max-w-[140px]">{{ auth.user?.email }}</span>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" class="flex-shrink-0 text-text-4">
        <path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Click-outside overlay -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute right-0 top-full mt-1 w-48 bg-bg-2 border border-border-l rounded-md shadow-xl py-1 z-50"
    >
      <RouterLink
        to="/account"
        class="flex items-center h-7 px-3 text-xs text-text-2 hover:bg-bg-4 hover:text-text-1 transition-colors duration-[140ms]"
        @click="close"
      >
        Account settings
      </RouterLink>
      <RouterLink
        to="/dashboard/trash"
        class="flex items-center h-7 px-3 text-xs text-text-2 hover:bg-bg-4 hover:text-text-1 transition-colors duration-[140ms]"
        @click="close"
      >
        Trash
      </RouterLink>
      <div class="h-px bg-border my-1 mx-1" />
      <button
        type="button"
        class="w-full flex items-center h-7 px-3 text-xs text-text-2 hover:bg-bg-4 hover:text-text-1 transition-colors duration-[140ms]"
        @click="signOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
