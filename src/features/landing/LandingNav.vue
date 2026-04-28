<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const scrolled = ref(false)

function onScroll(): void { scrolled.value = window.scrollY > 8 }

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav
    class="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-[60px] transition-all duration-300"
    :class="scrolled ? 'backdrop-blur-md bg-bg-0/60 border-b border-border/60' : 'bg-transparent'"
  >
    <!-- Logo -->
    <a href="/" class="font-sans font-bold text-xl text-text-1 tracking-tight select-none hover:text-white transition-colors">
      Loopa
    </a>

    <!-- Center links -->
    <div class="hidden md:flex items-center gap-8">
      <a href="#features" class="text-sm text-text-3 hover:text-text-1 transition-colors duration-200">Features</a>
      <a href="#pricing"  class="text-sm text-text-3 hover:text-text-1 transition-colors duration-200">Pricing</a>
      <a href="#"         class="text-sm text-text-3 hover:text-text-1 transition-colors duration-200">Docs</a>
    </div>

    <!-- CTA -->
    <a
      href="/app"
      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200
             bg-accent hover:bg-accent-h hover:shadow-[0_0_20px_rgb(67_83_255/0.4)] active:scale-95"
    >
      Try the editor <span aria-hidden="true">→</span>
    </a>
  </nav>
</template>
