<script setup lang="ts">
const PILLS = [
  '60fps playback', 'Cubic-bezier easing', 'Motion paths', 'SVG masks',
  'Frames', 'Lottie export', 'MP4 export', 'Components (soon)',
  'Web-native', 'Keyboard-first', 'Free in beta', 'Local-first', 'No install',
]
</script>

<template>
  <div class="relative overflow-hidden py-8 marquee-outer" aria-hidden="true">
    <!-- edge fades -->
    <div class="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
         style="background: linear-gradient(to right, var(--color-bg-0), transparent)" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
         style="background: linear-gradient(to left, var(--color-bg-0), transparent)" />

    <div class="marquee-track flex gap-3 w-max">
      <span
        v-for="(pill, i) in [...PILLS, ...PILLS]"
        :key="i"
        class="inline-flex items-center h-8 px-4 rounded-full border border-border bg-bg-3 text-sm text-text-2 whitespace-nowrap
               hover:border-[#4353ff]/60 hover:text-text-1 hover:shadow-[0_0_10px_rgb(67_83_255/0.2)] transition-all duration-200 cursor-default"
      >{{ pill }}</span>
    </div>
  </div>
</template>

<style scoped>
.marquee-track {
  animation: marquee 30s linear infinite;
}
.marquee-outer:hover .marquee-track {
  animation-play-state: paused;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
</style>
