import type { RectElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { PathElement } from '@/types/element'
import type { LottieShapeLayer } from '../types'
import { buildTransform, buildScalar } from '../tracks'
import { buildFills, buildStrokes, baseShapeLayer } from './shared'

export function buildRect(
  el: RectElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  const ks = buildTransform(el, tracks, totalFrames, mp, pathEl)

  const wTrack = tracks.find(t => t.property === 'width'  && t.enabled)
  const hTrack = tracks.find(t => t.property === 'height' && t.enabled)

  // Lottie rc: center at (0,0) in layer space, size = [w, h]
  const rc: unknown = {
    ty: 'rc',
    nm: 'Rect',
    p: { a: 0, k: [0, 0] },
    s: {
      a: (wTrack?.keyframes.length || hTrack?.keyframes.length) ? 1 : 0,
      k: (wTrack?.keyframes.length || hTrack?.keyframes.length)
        ? buildPairKfs(wTrack, hTrack, el.width, el.height, totalFrames)
        : [el.width, el.height],
    },
    r: { a: 0, k: el.radiusTopLeft || el.rx || 0 },
  }

  return baseShapeLayer(el, 0, totalFrames, ks, [
    rc,
    ...buildFills(el, tracks),
    ...buildStrokes(el, tracks),
  ])
}

function buildPairKfs(
  wTrack: Track | undefined,
  hTrack: Track | undefined,
  defaultW: number,
  defaultH: number,
  totalFrames: number,
): unknown[] {
  const wAnim = wTrack?.keyframes.length ? buildScalar(wTrack, defaultW) : null
  const hAnim = hTrack?.keyframes.length ? buildScalar(hTrack, defaultH) : null
  const times = new Set<number>()
  wTrack?.keyframes.forEach(k => times.add(k.frame))
  hTrack?.keyframes.forEach(k => times.add(k.frame))
  const sorted = [...times].sort((a, b) => a - b)
  return sorted.map((t, idx) => {
    const wKfs = wAnim?.a === 1 ? wAnim.k : null
    const hKfs = hAnim?.a === 1 ? hAnim.k : null
    const w = wKfs?.find(k => k.t === t)?.s[0] ?? (wAnim?.a === 0 ? Number(wAnim.k) : defaultW)
    const h = hKfs?.find(k => k.t === t)?.s[0] ?? (hAnim?.a === 0 ? Number(hAnim.k) : defaultH)
    const lkf: Record<string, unknown> = { t, s: [w, h] }
    if (idx < sorted.length - 1) {
      lkf['o'] = { x: [1, 1], y: [1, 1] }; lkf['i'] = { x: [0, 0], y: [0, 0] }
    }
    return lkf
  })
}
