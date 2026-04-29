<script setup lang="ts">
import { useRoute } from 'vue-router'
import AuthCard from '@/features/auth/AuthCard.vue'
import AuthForm from '@/features/auth/AuthForm.vue'

const route        = useRoute()
const resetSuccess = route.query.reset === 'success'
</script>

<template>
  <AuthCard>
    <p v-if="resetSuccess" class="text-xs text-success mb-4 text-center">
      Password updated. Sign in with your new password.
    </p>
    <h1 class="text-text-1 text-sm font-semibold mb-6">Welcome to Loopa</h1>
    <AuthForm />
  </AuthCard>
</template>
