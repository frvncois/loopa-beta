<script setup lang="ts">
import ScrollReveal from './primitives/ScrollReveal.vue'

// Mini animation for Format pills cycling
import { ref, onMounted, onBeforeUnmount } from 'vue'
const FORMATS = ['Lottie', 'MP4', 'SVG']
const fmtIdx = ref(0)
let fmtTimer = 0
onMounted(() => { fmtTimer = window.setInterval(() => { fmtIdx.value = (fmtIdx.value + 1) % 3 }, 1400) })
onBeforeUnmount(() => clearInterval(fmtTimer))
</script>

<template>
  <section id="features" class="py-32 max-w-7xl mx-auto px-6 md:px-10">
    <ScrollReveal>
      <div class="text-center mb-16">
        <h2 class="font-sans font-bold text-4xl md:text-5xl text-text-1 tracking-tight mb-4">
          The editor AE users wish existed.
        </h2>
        <p class="text-lg text-text-3 max-w-xl mx-auto">
          All the motion primitives. None of the 4GB install.
        </p>
      </div>
    </ScrollReveal>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card 1: Keyframe everything -->
      <ScrollReveal>
        <div class="group relative flex flex-col gap-5 p-8 rounded-2xl border border-border bg-bg-2
                    hover:-translate-y-1 hover:border-[#4353ff]/40 hover:shadow-[0_0_40px_rgb(67_83_255/0.1)]
                    transition-all duration-300 cursor-default">
          <!-- Mini animation: keyframe being captured -->
          <div class="h-[120px] flex items-center justify-center overflow-hidden rounded-xl bg-bg-1 relative">
            <svg width="200" height="80" viewBox="0 0 200 80">
              <!-- Track -->
              <rect x="10" y="38" width="180" height="2" rx="1" fill="#252530" />
              <!-- Existing keyframes -->
              <polygon points="50,35 57,38 50,41 43,38" fill="#4353ff" opacity="0.6" />
              <polygon points="110,35 117,38 110,41 103,38" fill="#4353ff" opacity="0.6" />
              <!-- New keyframe animating in -->
              <polygon points="155,35 162,38 155,41 148,38" fill="#4353ff"
                class="group-hover:[animation-duration:0.4s]"
                style="animation: kfpop 1.8s cubic-bezier(0,0,0.2,1) infinite"
              />
              <!-- Value label -->
              <rect x="130" y="14" width="48" height="16" rx="3" fill="#17171b" stroke="#252530" stroke-width="1" />
              <text x="154" y="25" font-size="9" fill="#a0a0ae" text-anchor="middle" font-family="JetBrains Mono, monospace">x: 320</text>
              <!-- Connector line -->
              <line x1="154" y1="30" x2="154" y2="35" stroke="#4353ff" stroke-width="1" opacity="0.5"
                    style="animation: kfpop 1.8s cubic-bezier(0,0,0.2,1) infinite" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-text-1 mb-2">Keyframe everything</h3>
            <p class="text-text-3 leading-relaxed">
              Click. Scrub. Snapshot. The keyframe button captures every animatable property at the playhead. No diamond-per-row tedium.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <!-- Card 2: Real motion -->
      <ScrollReveal>
        <div class="group relative flex flex-col gap-5 p-8 rounded-2xl border border-border bg-bg-2
                    hover:-translate-y-1 hover:border-[#4353ff]/40 hover:shadow-[0_0_40px_rgb(67_83_255/0.1)]
                    transition-all duration-300 cursor-default">
          <div class="h-[120px] flex items-center justify-center rounded-xl bg-bg-1 overflow-hidden">
            <svg width="200" height="90" viewBox="0 0 200 90">
              <!-- Curve path -->
              <path d="M 20 70 C 60 10 140 80 180 20" fill="none" stroke="#4353ff" stroke-width="1.5"
                    stroke-dasharray="5 5" opacity="0.4" />
              <!-- Dot following path -->
              <circle r="7" fill="rgb(15,197,233)" opacity="0.9"
                      style="animation: followpath 2s cubic-bezier(0.42,0,0.58,1) infinite"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-text-1 mb-2">Real motion, not CSS</h3>
            <p class="text-text-3 leading-relaxed">
              Cubic-bezier easing, motion paths, masks, frames, components. The web finally has the primitives motion designers actually want.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <!-- Card 3: Export -->
      <ScrollReveal>
        <div class="group relative flex flex-col gap-5 p-8 rounded-2xl border border-border bg-bg-2
                    hover:-translate-y-1 hover:border-[#4353ff]/40 hover:shadow-[0_0_40px_rgb(67_83_255/0.1)]
                    transition-all duration-300 cursor-default">
          <div class="h-[120px] flex items-center justify-center rounded-xl bg-bg-1">
            <div class="flex gap-2">
              <span
                v-for="(fmt, i) in FORMATS"
                :key="fmt"
                class="px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-all duration-500"
                :class="i === fmtIdx
                  ? 'bg-[#4353ff]/20 border-[#4353ff]/60 text-[#818cff] shadow-[0_0_12px_rgb(67_83_255/0.3)]'
                  : 'bg-bg-2 border-border text-text-4'"
              >{{ fmt }}</span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-text-1 mb-2">From browser to ship</h3>
            <p class="text-text-3 leading-relaxed">
              Export to Lottie, MP4, WebM, SVG+CSS. Drop into your stack. No After Effects. No Bodymovin. No 4GB install.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
</template>

<style scoped>
@keyframes kfpop {
  0%, 100% { opacity: 0; transform: translateY(6px) scale(0.6); }
  40%, 80% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes followpath {
  0%   { offset-path: path('M 20 70 C 60 10 140 80 180 20'); offset-distance: 0%; }
  100% { offset-path: path('M 20 70 C 60 10 140 80 180 20'); offset-distance: 100%; }
}
circle[style*="followpath"] {
  offset-path: path('M 20 70 C 60 10 140 80 180 20');
  animation: followpath 2s cubic-bezier(0.42,0,0.58,1) infinite;
  cx: unset;
  cy: unset;
  offset-distance: 0%;
  offset-rotate: 0deg;
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
</style>
