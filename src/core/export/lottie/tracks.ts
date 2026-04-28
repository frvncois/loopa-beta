import type { Track, KeyframeValue } from '@/types/track'
import type { BaseElement, PathElement } from '@/types/element'
import type { MotionPath } from '@/types/motion-path'
import type { LottieAnimatable, LottieKeyframe, LottieTransform } from './types'
import { needsBaking, lottieEasingHandles } from './easing'
import { computeTrackValueAt } from '@/core/animation/tracks'
import { pointAtProgress } from '@/core/path/motionPathMath'
import { hexToRgb } from '@/core/utils/color'

// ── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: KeyframeValue | undefined, fallback: number): number {
  if (v === undefined) return fallback
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || fallback
  return fallback
}

function hexToLottieColor(hex: string): number[] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [0, 0, 0, 1]
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1]
}

/** Expand bakeable segments to per-frame linear keyframes. Return normalized list. */
function normalizeKfs(
  track: Track,
): Array<{ frame: number; value: KeyframeValue; baked: boolean }> {
  const kfs = track.keyframes
  if (!kfs.length) return []
  const out: Array<{ frame: number; value: KeyframeValue; baked: boolean }> = []

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]!
    const b = kfs[i + 1]!
    if (needsBaking(a.easing)) {
      for (let f = a.frame; f < b.frame; f++) {
        out.push({ frame: f, value: computeTrackValueAt(track, f) ?? a.value, baked: true })
      }
    } else {
      out.push({ frame: a.frame, value: a.value, baked: false })
    }
  }
  const last = kfs[kfs.length - 1]!
  out.push({ frame: last.frame, value: last.value, baked: true })
  return out
}

// ── Scalar ───────────────────────────────────────────────────────────────────

/** Build a single-dimension animated property with optional scaling (e.g. opacity ×100). */
export function buildScalar(
  track: Track | undefined,
  defaultVal: number,
  scale = 1,
): LottieAnimatable {
  if (!track?.keyframes.length) return { a: 0, k: defaultVal * scale }
  const norm = normalizeKfs(track)
  const kfs: LottieKeyframe[] = norm.map((n, idx) => {
    const isLast = idx === norm.length - 1
    const lkf: LottieKeyframe = { t: n.frame, s: [toNum(n.value, defaultVal) * scale] }
    if (!isLast) {
      if (n.baked) {
        lkf.o = { x: [1], y: [1] }; lkf.i = { x: [0], y: [0] }
      } else {
        const kf = track.keyframes.find(k => k.frame === n.frame)
        const h = kf ? lottieEasingHandles(kf.easing) : null
        if (h) { lkf.o = h.o; lkf.i = h.i }
      }
    }
    return lkf
  })
  return { a: 1, k: kfs }
}

// ── Color ────────────────────────────────────────────────────────────────────

export function buildColor(track: Track | undefined, defaultHex: string): LottieAnimatable {
  if (!track?.keyframes.length) return { a: 0, k: hexToLottieColor(defaultHex) }
  const norm = normalizeKfs(track)
  const kfs: LottieKeyframe[] = norm.map((n, idx) => {
    const isLast = idx === norm.length - 1
    const lkf: LottieKeyframe = { t: n.frame, s: hexToLottieColor(String(n.value)) }
    if (!isLast) {
      if (n.baked) {
        lkf.o = { x: [1, 1, 1, 1], y: [1, 1, 1, 1] }
        lkf.i = { x: [0, 0, 0, 0], y: [0, 0, 0, 0] }
      } else {
        const kf = track.keyframes.find(k => k.frame === n.frame)
        const h = kf ? lottieEasingHandles(kf.easing) : null
        if (h) {
          lkf.o = { x: [h.o.x[0]!, h.o.x[0]!, h.o.x[0]!, h.o.x[0]!], y: [h.o.y[0]!, h.o.y[0]!, h.o.y[0]!, h.o.y[0]!] }
          lkf.i = { x: [h.i.x[0]!, h.i.x[0]!, h.i.x[0]!, h.i.x[0]!], y: [h.i.y[0]!, h.i.y[0]!, h.i.y[0]!, h.i.y[0]!] }
        }
      }
    }
    return lkf
  })
  return { a: 1, k: kfs }
}

// ── 2D Position ──────────────────────────────────────────────────────────────

function buildPosition(
  xTrack: Track | undefined,
  yTrack: Track | undefined,
  el: BaseElement,
): LottieAnimatable {
  const ox = el.transformOrigin?.x ?? 0.5
  const oy = el.transformOrigin?.y ?? 0.5
  const cx = el.x + ox * el.width
  const cy = el.y + oy * el.height

  if (!xTrack?.keyframes.length && !yTrack?.keyframes.length) {
    return { a: 0, k: [cx, cy] }
  }

  // Collect all keyframe times
  const times = new Set<number>()
  xTrack?.keyframes.forEach(k => times.add(k.frame))
  yTrack?.keyframes.forEach(k => times.add(k.frame))

  const anyBaked =
    (xTrack?.keyframes.some(k => needsBaking(k.easing)) ?? false) ||
    (yTrack?.keyframes.some(k => needsBaking(k.easing)) ?? false)

  const sortedTimes = [...times].sort((a, b) => a - b)

  const kfs: LottieKeyframe[] = sortedTimes.map((t, idx) => {
    const xVal = xTrack?.keyframes.length ? toNum(computeTrackValueAt(xTrack, t), el.x) : el.x
    const yVal = yTrack?.keyframes.length ? toNum(computeTrackValueAt(yTrack, t), el.y) : el.y
    const lkf: LottieKeyframe = { t, s: [xVal + ox * el.width, yVal + oy * el.height] }

    if (idx < sortedTimes.length - 1) {
      if (anyBaked) {
        lkf.o = { x: [1, 1], y: [1, 1] }; lkf.i = { x: [0, 0], y: [0, 0] }
      } else {
        const xKf = xTrack?.keyframes.find(k => k.frame === t)
        const yKf = yTrack?.keyframes.find(k => k.frame === t)
        const h = lottieEasingHandles((xKf ?? yKf)?.easing ?? 'linear')
        if (h) {
          lkf.o = { x: [h.o.x[0]!, h.o.x[0]!], y: [h.o.y[0]!, h.o.y[0]!] }
          lkf.i = { x: [h.i.x[0]!, h.i.x[0]!], y: [h.i.y[0]!, h.i.y[0]!] }
        }
      }
    }
    return lkf
  })
  return { a: 1, k: kfs }
}

// ── Motion path baked position ────────────────────────────────────────────────

function buildBakedPosition(
  el: BaseElement,
  mp: MotionPath,
  pathEl: PathElement,
  totalFrames: number,
): LottieAnimatable {
  const ox = el.transformOrigin?.x ?? 0.5
  const oy = el.transformOrigin?.y ?? 0.5
  const range = mp.endFrame - mp.startFrame

  const kfs: LottieKeyframe[] = []
  for (let f = 0; f <= totalFrames; f++) {
    let x: number
    let y: number
    if (range > 0 && f >= mp.startFrame && f <= mp.endFrame) {
      const progress = (f - mp.startFrame) / range
      const { position } = pointAtProgress(pathEl.points, pathEl.closed, progress)
      x = pathEl.x + position.x
      y = pathEl.y + position.y
    } else if (range > 0 && f > mp.endFrame) {
      const { position } = pointAtProgress(pathEl.points, pathEl.closed, 1)
      x = pathEl.x + position.x
      y = pathEl.y + position.y
    } else {
      x = el.x; y = el.y
    }
    const isLast = f === totalFrames
    const lkf: LottieKeyframe = { t: f, s: [x + ox * el.width, y + oy * el.height] }
    if (!isLast) { lkf.o = { x: [1, 1], y: [1, 1] }; lkf.i = { x: [0, 0], y: [0, 0] } }
    kfs.push(lkf)
  }
  return { a: 1, k: kfs }
}

// ── Full transform ────────────────────────────────────────────────────────────

export function buildTransform(
  el: BaseElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieTransform {
  const byProp = (p: string) => tracks.find(t => t.property === p && t.enabled)

  const ox = el.transformOrigin?.x ?? 0.5
  const oy = el.transformOrigin?.y ?? 0.5
  const ax = (ox - 0.5) * el.width
  const ay = (oy - 0.5) * el.height

  const position: LottieAnimatable =
    mp && pathEl
      ? buildBakedPosition(el, mp, pathEl, totalFrames)
      : buildPosition(byProp('x'), byProp('y'), el)

  const sxTrack = byProp('scaleX')
  const syTrack = byProp('scaleY')
  let scale: LottieAnimatable
  if (!sxTrack?.keyframes.length && !syTrack?.keyframes.length) {
    scale = { a: 0, k: [el.scaleX * 100, el.scaleY * 100] }
  } else {
    const times = new Set<number>()
    sxTrack?.keyframes.forEach(k => times.add(k.frame))
    syTrack?.keyframes.forEach(k => times.add(k.frame))
    const sorted = [...times].sort((a, b) => a - b)
    const kfs: LottieKeyframe[] = sorted.map((t, idx) => {
      const sx = sxTrack?.keyframes.length ? toNum(computeTrackValueAt(sxTrack, t), el.scaleX) : el.scaleX
      const sy = syTrack?.keyframes.length ? toNum(computeTrackValueAt(syTrack, t), el.scaleY) : el.scaleY
      const lkf: LottieKeyframe = { t, s: [sx * 100, sy * 100] }
      if (idx < sorted.length - 1) {
        lkf.o = { x: [1, 1], y: [1, 1] }; lkf.i = { x: [0, 0], y: [0, 0] }
      }
      return lkf
    })
    scale = { a: 1, k: kfs }
  }

  return {
    a: { a: 0, k: [ax, ay] },
    p: position,
    s: scale,
    r: buildScalar(byProp('rotation'), el.rotation),
    o: buildScalar(byProp('opacity'), el.opacity, 100),
  }
}
