<script setup lang="ts">
import '@/assets/styles/landing.css'
import LandingNav      from '@/features/landing/LandingNav.vue'
import LandingHero     from '@/features/landing/LandingHero.vue'
import LandingFeatures from '@/features/landing/LandingFeatures.vue'
import LogoMarquee     from '@/features/landing/marquee/LogoMarquee.vue'
import LandingPricing  from '@/features/landing/LandingPricing.vue'
import LandingCTA      from '@/features/landing/LandingCTA.vue'
import LandingFooter   from '@/features/landing/LandingFooter.vue'
</script>

<template>
  <div class="bg-bg-0 min-h-screen text-text-1 font-sans">
    <LandingNav />
    <main>
      <LandingHero />
      <LandingFeatures />
      <LogoMarquee />
      <LandingPricing />
      <LandingCTA />
    </main>
    <LandingFooter />
  </div>
</template>
