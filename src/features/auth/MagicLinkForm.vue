<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/ui/Button.vue'

const auth    = useAuthStore()
const email   = ref('')
const sent    = ref(false)
const error   = ref('')
const loading = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  const result  = await auth.signIn(email.value)
  loading.value = false
  if (result.ok) {
    sent.value = true
  } else {
    error.value = result.error ?? 'Something went wrong. Try again.'
  }
}
</script>

<template>
  <div v-if="sent" class="text-center">
    <p class="text-text-1 text-sm font-medium mb-1">Check your email</p>
    <p class="text-text-3 text-xs leading-relaxed">
      We sent a login link to <span class="text-text-2">{{ email }}</span>
    </p>
    <button
      class="mt-4 text-xs text-text-4 hover:text-text-2 transition-colors duration-[140ms]"
      @click="sent = false"
    >
      Use a different email
    </button>
  </div>

  <form v-else class="flex flex-col gap-3" @submit.prevent="submit">
    <div class="flex flex-col gap-1.5">
      <label class="text-xs text-text-3 font-medium">Email</label>
      <input
        v-model="email"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
        class="h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
      />
    </div>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <Button variant="accent" :disabled="loading" class="w-full">
      {{ loading ? 'Sending…' : 'Send magic link' }}
    </Button>
  </form>
</template>
