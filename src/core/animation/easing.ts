import type { EasingType } from '@/types/track'

type EasingFn = (t: number) => number

// ── Cubic bezier solver (Newton-Raphson) ──────────────────────────────────

function calcBezier(t: number, a1: number, a2: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 3 * a1 * t + (3 * a2 - 6 * a1) * t2 + (1 - 3 * a2 + 3 * a1) * t3
}

function getBezierSlope(t: number, a1: number, a2: number): number {
  return 3 * a1 + 2 * (3 * a2 - 6 * a1) * t + 3 * (1 - 3 * a2 + 3 * a1) * t * t
}

function getTForX(x: number, x1: number, x2: number): number {
  let t = x
  for (let i = 0; i < 8; i++) {
    const slope = getBezierSlope(t, x1, x2)
    if (Math.abs(slope) < 1e-6) break
    t -= (calcBezier(t, x1, x2) - x) / slope
  }
  return Math.max(0, Math.min(1, t))
}

function cubicBezierEasing(x1: number, y1: number, x2: number, y2: number): EasingFn {
  return (x: number): number => {
    if (x === 0 || x === 1) return x
    return calcBezier(getTForX(x, x1, x2), y1, y2)
  }
}

// ── Steps ─────────────────────────────────────────────────────────────────

function stepsEasing(count: number): EasingFn {
  return (t: number) => Math.floor(Math.min(t * count, count - 1)) / count
}

// ── Bounce (helper) ───────────────────────────────────────────────────────

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  let x = t
  if (x < 1 / d1) return n1 * x * x
  if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75 }
  if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375 }
  x -= 2.625 / d1
  return n1 * x * x + 0.984375
}

// ── Easing registry ───────────────────────────────────────────────────────

const EASING_FNS: Record<string, EasingFn> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => 1 - (1 - t) ** 3,
  'ease-in-out-cubic': (t) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  'ease-in-back': (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  'ease-out-back': (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
  },
  'ease-in-out-back': (t) => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
      : ((2 * t - 2) ** 2 * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2
  },
  'ease-out-bounce': easeOutBounce,
  'ease-out-elastic': (t) => {
    if (t === 0) return 0
    if (t === 1) return 1
    return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1
  },
}

// ── Public API ────────────────────────────────────────────────────────────

export function getEasingFn(type: EasingType): EasingFn {
  const cached = EASING_FNS[type]
  if (cached !== undefined) return cached

  const cubicMatch = /^cubic-bezier\(([\d.-]+),([\d.-]+),([\d.-]+),([\d.-]+)\)$/.exec(type)
  if (cubicMatch !== null) {
    const x1 = Number(cubicMatch[1])
    const y1 = Number(cubicMatch[2])
    const x2 = Number(cubicMatch[3])
    const y2 = Number(cubicMatch[4])
    if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
      const fn = cubicBezierEasing(x1, y1, x2, y2)
      EASING_FNS[type] = fn
      return fn
    }
  }

  const stepsMatch = /^steps\((\d+)\)$/.exec(type)
  if (stepsMatch !== null) {
    const count = Number(stepsMatch[1])
    if (!isNaN(count) && count > 0) {
      const fn = stepsEasing(count)
      EASING_FNS[type] = fn
      return fn
    }
  }

  return EASING_FNS['linear'] ?? ((t) => t)
}
