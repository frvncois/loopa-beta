<script setup lang="ts">
import { ref } from 'vue'
import PillBadge from './primitives/PillBadge.vue'
import GradientText from './primitives/GradientText.vue'
import LandingCanvas from './LandingCanvas.vue'

const email = ref('')
const showEmail = ref(false)
const submitted = ref(false)

function onNotify(): void {
  if (!showEmail.value) { showEmail.value = true; return }
  if (email.value) {
    // TODO: wire to provider
    console.log('Email captured:', email.value)
    submitted.value = true
  }
}
</script>

<template>
  <section class="relative min-h-screen flex items-center pt-[60px]">
    <!-- Background glow -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
           style="background: var(--gradient-aurora); filter: blur(120px)" />
    </div>

    <div class="relative w-full max-w-7xl mx-auto px-6 md:px-10 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
      <!-- Left column -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <div>
          <PillBadge :glow="true">
            <span class="w-1.5 h-1.5 rounded-full bg-[#818cff] animate-pulse" />
            Early Access
          </PillBadge>
        </div>

        <h1 class="font-sans font-bold text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-0.04em] text-text-1">
          Animation,<br />made <GradientText>fast.</GradientText>
        </h1>

        <p class="text-lg md:text-xl text-text-2 leading-relaxed max-w-md">
          AE-grade keyframe motion. Web-native speed.<br class="hidden md:block" />
          Ships Lottie, MP4, SVG.
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-3">
          <a
            href="/app"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white
                   transition-all duration-200 active:scale-95 hover:shadow-[0_0_32px_rgb(67_83_255/0.5)] hover:-translate-y-0.5"
            style="background: var(--gradient-aurora)"
          >
            Try the editor <span aria-hidden="true">→</span>
          </a>

          <div class="flex gap-2">
            <template v-if="!submitted">
              <input
                v-if="showEmail"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                class="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-3 border border-border text-text-1 placeholder:text-text-4
                       focus:outline-none focus:border-accent transition-colors"
                @keydown.enter="onNotify"
              />
              <button
                type="button"
                class="px-5 py-3 rounded-xl text-sm font-medium text-text-2 border border-border bg-bg-2
                       hover:text-text-1 hover:border-border-l transition-all duration-200 whitespace-nowrap"
                @click="onNotify"
              >
                {{ showEmail ? 'Notify me' : 'Get export updates' }}
              </button>
            </template>
            <p v-else class="flex items-center text-sm text-text-3 py-3">
              ✓ You're on the list.
            </p>
          </div>
        </div>

        <p class="text-sm text-text-4">Free during early access. No credit card.</p>
      </div>

      <!-- Right column: hero animation -->
      <div class="lg:col-span-7">
        <LandingCanvas />
      </div>
    </div>
  </section>
</template>
