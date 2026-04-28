<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSaveOrchestrator } from '@/composables/useSaveOrchestrator'

const router       = useRouter()
const route        = useRoute()
const auth         = useAuthStore()
const { promoteLocalToCloud } = useSaveOrchestrator()
const errorMsg     = ref('')

onMounted(async () => {
  // main.ts awaits refresh() before mounting, which in turn awaits the Supabase
  // client's initialization — including the automatic PKCE code exchange triggered
  // by detectSessionInUrl. No need to call exchangeCodeForSession here.
  await auth.refresh()

  if (auth.status !== 'authenticated') {
    errorMsg.value = 'The link has expired or is invalid.'
    return
  }

  // If the user saved a local project before logging in, promote it now.
  if (localStorage.getItem('loopa.pendingPromotion')) {
    try {
      const slug = await promoteLocalToCloud()
      router.replace(`/app/${slug}`)
      return
    } catch (err) {
      // Promotion failed (e.g. plan limit). Leave pending data intact
      // so the user doesn't lose their work. Return them to the editor.
      console.warn('Project promotion failed:', err)
      router.replace('/app')
      return
    }
  }

  const redirect = route.query.redirect as string | undefined
  router.replace(redirect ?? '/dashboard')
})
</script>

<template>
  <div class="min-h-screen bg-bg-0 flex items-center justify-center">
    <div v-if="errorMsg" class="text-center px-4">
      <p class="text-danger text-sm mb-3">{{ errorMsg }}</p>
      <RouterLink
        to="/login"
        class="text-xs text-text-3 hover:text-text-2 transition-colors duration-[140ms]"
      >
        Try again
      </RouterLink>
    </div>
    <p v-else class="text-text-4 text-xs">Signing you in…</p>
  </div>
</template>
