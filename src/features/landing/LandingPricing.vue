<script setup lang="ts">
import { ref } from 'vue'
import ScrollReveal from './primitives/ScrollReveal.vue'

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
  <section id="pricing" class="py-32 max-w-7xl mx-auto px-6 md:px-10">
    <ScrollReveal>
      <div class="text-center mb-4">
        <h2 class="font-sans font-bold text-4xl md:text-5xl text-text-1 tracking-tight mb-4">Simple pricing.</h2>
        <p class="text-text-3 text-base max-w-lg mx-auto">
          Indicative pricing. Finalizing for launch. Beta is currently free.
        </p>
      </div>
    </ScrollReveal>

    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <!-- Free -->
      <ScrollReveal>
        <div class="flex flex-col gap-6 p-8 rounded-2xl border border-border bg-bg-2 h-full">
          <div>
            <p class="text-sm text-text-3 font-medium mb-1">Free</p>
            <p class="text-4xl font-bold text-text-1">$0 <span class="text-lg font-normal text-text-3">/ forever</span></p>
          </div>
          <p class="text-text-3 text-sm leading-relaxed flex-1">
            Up to 3 projects, 100 frames per project, watermarked exports, all editor features.
          </p>
          <a
            href="/app"
            class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold
                   text-text-1 border border-border hover:border-border-l hover:bg-bg-3 transition-all duration-200"
          >
            Try the editor <span aria-hidden="true">→</span>
          </a>
        </div>
      </ScrollReveal>

      <!-- Pro -->
      <ScrollReveal>
        <div class="relative flex flex-col gap-6 p-8 rounded-2xl bg-bg-2 h-full"
             style="border: 1px solid transparent; background-clip: padding-box;
                    box-shadow: 0 0 0 1px rgb(67 83 255 / 0.5), 0 0 40px rgb(67 83 255 / 0.12)">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="inline-flex px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                  style="background: var(--gradient-aurora)">Most popular</span>
          </div>
          <div>
            <p class="text-sm text-text-3 font-medium mb-1">Pro</p>
            <p class="text-4xl font-bold text-text-1">$12 <span class="text-lg font-normal text-text-3">/ month</span></p>
          </div>
          <p class="text-text-3 text-sm leading-relaxed flex-1">
            Unlimited projects, no watermark, all export formats, priority support.
          </p>
          <div v-if="!submitted" class="flex flex-col gap-2">
            <input
              v-if="showEmail"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="px-4 py-2.5 rounded-xl text-sm bg-bg-3 border border-border text-text-1 placeholder:text-text-4
                     focus:outline-none focus:border-accent transition-colors"
              @keydown.enter="onNotify"
            />
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold
                     text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgb(67_83_255/0.4)]"
              style="background: var(--gradient-aurora)"
              @click="onNotify"
            >
              {{ showEmail ? 'Notify me at launch' : 'Get notified at launch →' }}
            </button>
          </div>
          <p v-else class="text-sm text-text-3 text-center py-1">✓ You're on the list.</p>
        </div>
      </ScrollReveal>

      <!-- Team -->
      <ScrollReveal>
        <div class="flex flex-col gap-6 p-8 rounded-2xl border border-border bg-bg-3 h-full">
          <div>
            <p class="text-sm text-text-3 font-medium mb-1">Team</p>
            <p class="text-4xl font-bold text-text-1">$29 <span class="text-lg font-normal text-text-3">/ mo / seat</span></p>
          </div>
          <p class="text-text-3 text-sm leading-relaxed flex-1">
            Everything in Pro, shared component libraries, version history, team workspaces.
          </p>
          <button
            type="button"
            class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold
                   text-text-1 border border-border hover:border-border-l hover:bg-bg-4 transition-all duration-200"
            @click="showEmail = true"
          >
            Get notified at launch →
          </button>
        </div>
      </ScrollReveal>
    </div>
  </section>
</template>
