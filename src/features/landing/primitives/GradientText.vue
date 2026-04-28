<template>
  <span class="gradient-text"><slot /></span>
</template>

<style scoped>
.gradient-text {
  background: var(--gradient-aurora);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: sweep 6s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .gradient-text { animation: none; background-position: 0 0; }
}
@keyframes sweep {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}
</style>
