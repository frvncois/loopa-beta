import type { BaseElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { LottieFill, LottieStroke, LottieShapeLayer, LottieTransform } from '../types'
import { buildScalar, buildColor } from '../tracks'

/** Hex without # → Lottie [r,g,b,1] normalized */
function hexToLottie(hex: string): number[] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b, 1]
}

export function buildFills(el: BaseElement, tracks: Track[]): LottieFill[] {
  const fills: LottieFill[] = []
  for (let i = 0; i < el.fills.length; i++) {
    const fill = el.fills[i]
    if (!fill?.visible || fill.type === 'none') continue
    const colorTrack = tracks.find(t => t.property === `fills.${i}.color` && t.enabled)
    const opacTrack  = tracks.find(t => t.property === `fills.${i}.opacity` && t.enabled)
    fills.push({
      ty: 'fl',
      c: buildColor(colorTrack, fill.color),
      o: buildScalar(opacTrack, fill.opacity, 100),
      r: 1,
    })
  }
  return fills
}

const CAP_MAP: Record<string, number>  = { butt: 1, round: 2, square: 3 }
const JOIN_MAP: Record<string, number> = { miter: 1, round: 2, bevel: 3 }

export function buildStrokes(el: BaseElement, tracks: Track[]): LottieStroke[] {
  const strokes: LottieStroke[] = []
  for (let i = 0; i < el.strokes.length; i++) {
    const s = el.strokes[i]
    if (!s?.visible || s.width === 0) continue
    const colorTrack = tracks.find(t => t.property === `strokes.${i}.color` && t.enabled)
    const widthTrack  = tracks.find(t => t.property === `strokes.${i}.width` && t.enabled)
    strokes.push({
      ty: 'st',
      c: buildColor(colorTrack, s.color),
      o: { a: 0, k: 100 },
      w: buildScalar(widthTrack, s.width),
      lc: CAP_MAP[s.cap]  ?? 2,
      lj: JOIN_MAP[s.join] ?? 2,
      ml: 4,
    })
  }
  return strokes
}

export function baseShapeLayer(
  el: BaseElement,
  ind: number,
  totalFrames: number,
  ks: LottieTransform,
  shapes: unknown[],
): LottieShapeLayer {
  return {
    ty: 4, ind,
    ip: 0, op: totalFrames, st: 0,
    nm: el.name || el.type,
    sr: 1, ao: 0,
    ks,
    shapes,
  }
}
