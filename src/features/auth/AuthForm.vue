<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/ui/Button.vue'

type Mode = 'signin' | 'signup'

const { onSuccess } = defineProps<{ onSuccess?: () => void }>()

const auth      = useAuthStore()
const router    = useRouter()
const route     = useRoute()
const mode      = ref<Mode>('signin')
const email     = ref('')
const password  = ref('')
const error     = ref('')
const loading   = ref(false)
const resetSent = ref(false)

function switchMode(m: Mode): void {
  mode.value      = m
  error.value     = ''
  resetSent.value = false
}

async function submit(): Promise<void> {
  error.value = ''
  if (mode.value === 'signup' && password.value.length < 12) {
    error.value = 'Password must be at least 12 characters.'
    return
  }
  loading.value = true
  const result = mode.value === 'signin'
    ? await auth.signIn(email.value, password.value)
    : await auth.signUp(email.value, password.value)
  loading.value = false
  if (!result.ok) {
    error.value = result.error ?? 'Something went wrong. Try again.'
    return
  }
  if (onSuccess) {
    onSuccess()
  } else {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.push(redirect)
  }
}

async function forgotPassword(): Promise<void> {
  if (!email.value) {
    error.value = 'Enter your email first.'
    return
  }
  error.value   = ''
  loading.value = true
  const result  = await auth.requestPasswordReset(email.value)
  loading.value = false
  if (result.ok) {
    resetSent.value = true
  } else {
    error.value = result.error ?? 'Could not send reset email. Try again.'
  }
}
</script>

<template>
  <!-- Reset email sent state -->
  <div v-if="resetSent" class="text-center">
    <p class="text-text-1 text-sm font-medium mb-1">Check your email</p>
    <p class="text-text-3 text-xs leading-relaxed">
      Reset link sent to <span class="text-text-2">{{ email }}</span>
    </p>
    <button
      class="mt-4 text-xs text-text-4 hover:text-text-2 transition-colors duration-[140ms]"
      @click="resetSent = false"
    >
      Use a different email
    </button>
  </div>

  <template v-else>
    <!-- Mode tabs -->
    <div class="flex gap-4 mb-5">
      <button
        class="pb-2 text-xs font-medium border-b-2 transition-colors duration-[140ms]"
        :class="mode === 'signin'
          ? 'text-text-1 border-accent'
          : 'text-text-3 border-transparent hover:text-text-2'"
        @click="switchMode('signin')"
      >
        Sign in
      </button>
      <button
        class="pb-2 text-xs font-medium border-b-2 transition-colors duration-[140ms]"
        :class="mode === 'signup'
          ? 'text-text-1 border-accent'
          : 'text-text-3 border-transparent hover:text-text-2'"
        @click="switchMode('signup')"
      >
        Sign up
      </button>
    </div>

    <!-- Form -->
    <form class="flex flex-col gap-3" @submit.prevent="submit">
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
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-text-3 font-medium">Password</label>
        <input
          v-model="password"
          type="password"
          required
          :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
          class="h-input bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
        />
        <p v-if="mode === 'signup'" class="text-xs text-text-4">12+ characters.</p>
      </div>
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
      <Button variant="accent" :disabled="loading" class="w-full">
        {{ loading
          ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
          : (mode === 'signin' ? 'Sign in' : 'Create account') }}
      </Button>
      <button
        v-if="mode === 'signin'"
        type="button"
        :disabled="loading"
        class="text-xs text-text-4 hover:text-text-2 disabled:opacity-40 transition-colors duration-[140ms] text-center"
        @click="forgotPassword"
      >
        Forgot password?
      </button>
    </form>
  </template>
</template>
