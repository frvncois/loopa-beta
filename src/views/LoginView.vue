<script setup lang="ts">
import AuthCard from '@/features/auth/AuthCard.vue'
import MagicLinkForm from '@/features/auth/MagicLinkForm.vue'
</script>

<template>
  <AuthCard>
    <h1 class="text-text-1 text-sm font-semibold mb-6">Sign in to Loopa</h1>
    <MagicLinkForm />
  </AuthCard>
</template>
