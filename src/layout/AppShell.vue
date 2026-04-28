<script setup lang="ts">
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-0 flex flex-col">
    <AppTopbar />
    <main class="flex-1 min-h-0">
      <slot />
    </main>
  </div>
</template>
