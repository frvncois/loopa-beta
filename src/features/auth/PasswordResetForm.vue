<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/ui/Button.vue'

const auth     = useAuthStore()
const router   = useRouter()
const password = ref('')
const confirm  = ref('')
const error    = ref('')
const loading  = ref(false)

async function submit(): Promise<void> {
  error.value = ''
  if (password.value.length < 12) {
    error.value = 'Password must be at least 12 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  const result  = await auth.updatePassword(password.value)
  loading.value = false
  if (!result.ok) {
    error.value = result.error ?? 'Could not update password. Try again.'
    return
  }
  await auth.signOut()
  await router.push('/login?reset=success')
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <div class="flex flex-col gap-1.5">
      <label class="text-xs text-text-3 font-medium">New password</label>
      <input
        v-model="password"
        type="password"
        required
        autocomplete="new-password"
        class="h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
      />
      <p class="text-xs text-text-4">12+ characters.</p>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-xs text-text-3 font-medium">Confirm password</label>
      <input
        v-model="confirm"
        type="password"
        required
        autocomplete="new-password"
        class="h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
      />
    </div>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <Button variant="accent" :disabled="loading" class="w-full">
      {{ loading ? 'Updating…' : 'Set new password' }}
    </Button>
  </form>
</template>
