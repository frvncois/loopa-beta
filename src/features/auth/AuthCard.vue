<script setup lang="ts">
// Centered card shell for auth flows (login, callback errors)
</script>

<template>
  <div class="min-h-screen bg-bg-0 flex items-center justify-center p-4">
    <div class="w-full max-w-[22rem] bg-bg-2 border border-border rounded-lg p-8">
      <slot />
    </div>
  </div>
</template>
