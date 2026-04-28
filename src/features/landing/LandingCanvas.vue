<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

const { reduced } = useReducedMotion()

const svgRef = ref<SVGSVGElement | null>(null)
const W = 640
const H = 480
const DURATION = 6000

// ── Easing ────────────────────────────────────────────────────────────────────
function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // Newton-Raphson approximation
  function bezier(t: number, a: number, b: number): number {
    return 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3
  }
  let x = t, s = t
  for (let i = 0; i < 8; i++) {
    const cx = bezier(x, p1x, p2x) - t
    const dx = 3 * p1x * (1 - x) ** 2 + 6 * (p2x - p1x) * x * (1 - x) + 3 * (1 - p2x) * x ** 2
    x -= cx / (dx || 1e-6)
  }
  return bezier(x, p1y, p2y)
}
const easeInOut = (t: number) => cubicBezier(t, 0.42, 0, 0.58, 1)
const easeOut   = (t: number) => cubicBezier(t, 0, 0, 0.2, 1)

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
function clamp01(t: number): number { return Math.max(0, Math.min(1, t)) }
function progress(p: number, start: number, end: number): number {
  return clamp01((p - start) / (end - start))
}
function lerpColor(a: [number,number,number], b: [number,number,number], t: number): string {
  const r = Math.round(lerp(a[0], b[0], t))
  const g = Math.round(lerp(a[1], b[1], t))
  const bl = Math.round(lerp(a[2], b[2], t))
  return `rgb(${r},${g},${bl})`
}

const BLUE:    [number,number,number] = [67,  83,  255]
const MAGENTA: [number,number,number] = [177, 75,  255]
const CYAN:    [number,number,number] = [15,  197, 233]

// Motion path for circle: a cubic bezier curve
function motionPathPoint(t: number): [number, number] {
  // Cubic bezier path: P0(80,320) → P1(200,80) → P2(440,400) → P3(560,160)
  const u = 1 - t
  const x = u**3*80 + 3*u**2*t*200 + 3*u*t**2*440 + t**3*560
  const y = u**3*320 + 3*u**2*t*80  + 3*u*t**2*400 + t**3*160
  return [x, y]
}

// Reactive SVG values
const rect = ref({ x: 220, y: 180, w: 200, h: 120, rx: 12, fill: 'rgb(67,83,255)', opacity: 0.9 })
const circle = ref({ cx: 80, cy: 320, r: 12, fill: 'rgb(15,197,233)', opacity: 0.9 })
const trail = ref<{ cx: number; cy: number; opacity: number }[]>([])
const text = ref({ y: 260, opacity: 0, scale: 0.8, blur: 8 })
const playheadX = ref(0)
const liveX = ref(0)
const liveY = ref(0)
const liveRot = ref(0)
const recOpacity = ref(1)

// Animation state
let rafId = 0
let startTime = 0
let observer: IntersectionObserver | null = null
let paused = false

function tick(now: number): void {
  if (paused) return
  if (!startTime) startTime = now
  const elapsed = (now - startTime) % DURATION
  const p = elapsed / DURATION // 0..1 looping

  // ── Layer 1: morphing rect ─────────────────────────────────────────────────
  // Sequence: 0→0.2 square, 0.2→0.4 → wide bar, 0.4→0.6 → circle, 0.6→0.8 → square
  const morphP = p < 0.25
    ? easeInOut(progress(p, 0, 0.25))
    : p < 0.5
    ? easeInOut(progress(p, 0.25, 0.5))
    : p < 0.75
    ? easeInOut(progress(p, 0.5, 0.75))
    : easeInOut(progress(p, 0.75, 1.0))

  let rw: number, rh: number, rrx: number
  if (p < 0.25) {
    rw = lerp(180, 180, morphP); rh = lerp(180, 180, morphP); rrx = lerp(16, 16, morphP)
  } else if (p < 0.5) {
    rw = lerp(180, 300, easeInOut(progress(p, 0.25, 0.5)))
    rh = lerp(180, 60, easeInOut(progress(p, 0.25, 0.5)))
    rrx = 8
  } else if (p < 0.75) {
    rw = lerp(300, 140, easeInOut(progress(p, 0.5, 0.75)))
    rh = lerp(60, 140, easeInOut(progress(p, 0.5, 0.75)))
    rrx = lerp(8, 70, easeInOut(progress(p, 0.5, 0.75)))
  } else {
    rw = lerp(140, 180, easeInOut(progress(p, 0.75, 1.0)))
    rh = lerp(140, 180, easeInOut(progress(p, 0.75, 1.0)))
    rrx = lerp(70, 16, easeInOut(progress(p, 0.75, 1.0)))
  }

  const colorT = p < 0.5 ? easeInOut(p * 2) : easeInOut((p - 0.5) * 2)
  const fillColor = p < 0.5
    ? lerpColor(BLUE, MAGENTA, colorT)
    : lerpColor(MAGENTA, CYAN, colorT)

  rect.value = {
    x: W/2 - rw/2,
    y: H/2 - rh/2 - 20,
    w: rw, h: rh, rx: rrx,
    fill: fillColor,
    opacity: 0.85,
  }

  // ── Layer 2: circle on motion path with trail ──────────────────────────────
  const pathT = easeInOut(p)
  const [cx, cy] = motionPathPoint(pathT)
  const trailArr: { cx: number; cy: number; opacity: number }[] = []
  for (let i = 1; i <= 8; i++) {
    const tTrail = clamp01(pathT - i * 0.035)
    const [tx, ty] = motionPathPoint(tTrail)
    trailArr.push({ cx: tx, cy: ty, opacity: (1 - i / 8) * 0.4 })
  }
  circle.value = { cx, cy, r: 10, fill: 'rgb(15,197,233)', opacity: 0.95 }
  trail.value = trailArr

  // ── Layer 3: text (mobile hides) ───────────────────────────────────────────
  const textP = p
  let tOpacity: number, tScale: number, tBlur: number, tY: number
  if (textP < 0.15) {
    const t = easeOut(progress(textP, 0.0, 0.15))
    tOpacity = t; tScale = lerp(0.8, 1.0, t); tBlur = lerp(8, 0, t); tY = lerp(275, 255, t)
  } else if (textP < 0.75) {
    tOpacity = 1; tScale = 1; tBlur = 0; tY = lerp(255, 240, progress(textP, 0.15, 0.75))
  } else {
    const t = easeInOut(progress(textP, 0.75, 1.0))
    tOpacity = lerp(1, 0, t); tScale = 1; tBlur = lerp(0, 4, t); tY = lerp(240, 230, t)
  }
  text.value = { y: tY, opacity: tOpacity, scale: tScale, blur: tBlur }

  // ── UI chrome ──────────────────────────────────────────────────────────────
  playheadX.value = 160 + p * (W - 200)
  liveX.value = Math.round(rect.value.x)
  liveY.value = Math.round(rect.value.y)
  liveRot.value = Math.round(p * 360) % 360
  recOpacity.value = 0.5 + 0.5 * Math.sin(now / 500)

  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (reduced.value) return // render static final frame, no rAF

  if (!svgRef.value) return
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) { paused = false; if (!rafId) rafId = requestAnimationFrame(tick) }
    else { paused = true; cancelAnimationFrame(rafId); rafId = 0 }
  }, { threshold: 0.1 })
  observer.observe(svgRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  observer?.disconnect()
})

// Motion path SVG "d" for the visible dashed guide
const motionPathD = 'M 80 320 C 200 80 440 400 560 160'
</script>

<template>
  <div class="relative w-full rounded-2xl overflow-hidden border border-border bg-bg-1"
       style="aspect-ratio: 4/3">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-full"
      style="display:block"
    >
      <!-- Dot grid background -->
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.5" fill="var(--grid-line)" />
        </pattern>
        <filter id="blur-text">
          <feGaussianBlur :stdDeviation="text.blur" />
        </filter>
        <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#4353ff" />
          <stop offset="50%"  stop-color="#b14bff" />
          <stop offset="100%" stop-color="#ff5b9e" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />

      <!-- Layer 1: morphing rect -->
      <rect
        :x="rect.x" :y="rect.y"
        :width="rect.w" :height="rect.h"
        :rx="rect.rx"
        :fill="rect.fill"
        :opacity="rect.opacity"
      />

      <!-- Layer 2: motion path guide (dashed) -->
      <path
        :d="motionPathD"
        fill="none"
        stroke="#4353ff"
        stroke-width="1"
        stroke-dasharray="4 6"
        opacity="0.25"
      />

      <!-- Trail dots -->
      <circle
        v-for="(t, i) in trail"
        :key="i"
        :cx="t.cx" :cy="t.cy" r="4"
        fill="rgb(15,197,233)"
        :opacity="t.opacity"
      />

      <!-- Circle on path -->
      <circle
        :cx="circle.cx" :cy="circle.cy" :r="circle.r"
        :fill="circle.fill"
        :opacity="circle.opacity"
      />
      <circle
        :cx="circle.cx" :cy="circle.cy" r="18"
        fill="rgb(15,197,233)"
        opacity="0.12"
      />

      <!-- Layer 3: Loopa text (hidden on small screens via opacity driven by rAF) -->
      <g
        :transform="`translate(${W/2}, ${text.y}) scale(${text.scale})`"
        :opacity="text.opacity"
        :filter="text.blur > 0.5 ? 'url(#blur-text)' : undefined"
      >
        <text
          text-anchor="middle"
          font-family="DM Sans, sans-serif"
          font-size="48"
          font-weight="700"
          fill="url(#aurora)"
          letter-spacing="-1"
        >Loopa</text>
      </g>

      <!-- UI chrome: property panel sliver (top-right) -->
      <g opacity="0.7">
        <rect x="460" y="12" width="168" height="72" rx="6" fill="#17171b" stroke="#252530" stroke-width="1" />
        <text x="472" y="30" font-size="8" fill="#6a6a7e" font-family="JetBrains Mono, monospace">TRANSFORM</text>
        <text x="472" y="46" font-size="9" fill="#a0a0ae" font-family="JetBrains Mono, monospace">
          X <tspan fill="#ededf0">{{ liveX }}</tspan>
        </text>
        <text x="520" y="46" font-size="9" fill="#a0a0ae" font-family="JetBrains Mono, monospace">
          Y <tspan fill="#ededf0">{{ liveY }}</tspan>
        </text>
        <text x="472" y="62" font-size="9" fill="#a0a0ae" font-family="JetBrains Mono, monospace">
          R <tspan fill="#ededf0">{{ liveRot }}°</tspan>
        </text>
      </g>

      <!-- REC indicator -->
      <g :opacity="recOpacity">
        <circle cx="22" cy="22" r="5" fill="#ff5b9e" />
        <text x="32" y="26" font-size="9" fill="#ff5b9e" font-family="JetBrains Mono, monospace" font-weight="600">REC</text>
      </g>

      <!-- UI chrome: timeline strip (bottom) -->
      <g>
        <rect x="0" :y="H - 28" :width="W" height="28" fill="#111114" opacity="0.9" />
        <line x1="0" :y1="H - 28" :x2="W" :y2="H - 28" stroke="#252530" stroke-width="1" />
        <!-- Ruler ticks -->
        <g v-for="i in 13" :key="i" opacity="0.5">
          <line
            :x1="160 + (i-1) * 40" :y1="H - 20"
            :x2="160 + (i-1) * 40" :y2="H - 12"
            stroke="#2e2e3a" stroke-width="1"
          />
        </g>
        <!-- Playhead -->
        <line :x1="playheadX" :y1="H - 28" :x2="playheadX" :y2="H" stroke="#4353ff" stroke-width="1.5" />
        <polygon
          :points="`${playheadX - 4},${H - 28} ${playheadX + 4},${H - 28} ${playheadX},${H - 21}`"
          fill="#4353ff"
        />
      </g>
    </svg>
  </div>
</template>
