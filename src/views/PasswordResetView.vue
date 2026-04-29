<script setup lang="ts">
import AuthCard from '@/features/auth/AuthCard.vue'
import PasswordResetForm from '@/features/auth/PasswordResetForm.vue'
</script>

<template>
  <AuthCard>
    <h1 class="text-text-1 text-sm font-semibold mb-6">Set a new password</h1>
    <PasswordResetForm />
  </AuthCard>
</template>
