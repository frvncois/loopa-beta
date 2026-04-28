<template>
  <section class="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
    <!-- Aurora background -->
    <div class="absolute inset-0 bg-bg-0">
      <div class="absolute inset-0 opacity-[0.08]" style="background: var(--gradient-aurora)" />
      <div class="absolute inset-0 opacity-[0.04]"
           style="background: var(--grid-line); background-image: radial-gradient(circle, var(--grid-line) 1px, transparent 1px); background-size: 24px 24px" />
    </div>
    <!-- Glow orbs -->
    <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.15]"
         style="background: var(--gradient-aurora); filter: blur(100px); border-radius: 50%" />

    <div class="relative z-10 text-center px-6 py-24">
      <h2 class="font-sans font-bold text-5xl md:text-6xl lg:text-7xl text-text-1 tracking-[-0.04em] mb-6 leading-[0.95]">
        Make something move.
      </h2>
      <p class="text-lg md:text-xl text-text-3 mb-10 max-w-md mx-auto">
        Free during early access. Lives in your browser. Exports coming.
      </p>
      <a
        href="/app"
        class="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-bg-0
               bg-white hover:bg-text-1 hover:shadow-[0_0_40px_rgb(255_255_255/0.2)] hover:-translate-y-0.5
               active:scale-95 transition-all duration-200"
      >
        Open the editor <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>
</template>
