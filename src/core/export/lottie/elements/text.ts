import type { TextElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { LottieTextLayer, LottieTransform } from '../types'
import { buildTransform } from '../tracks'

const ALIGN_MAP: Record<string, number> = { left: 0, center: 1, right: 2, justify: 3 }

export function buildText(
  el: TextElement,
  tracks: Track[],
  totalFrames: number,
): LottieTextLayer {
  const ks: LottieTransform = buildTransform(el, tracks, totalFrames)

  const textData = {
    d: {
      k: [{
        t: 0,
        s: {
          t: el.text,
          s: el.fontSize,
          f: el.fontFamily || 'DM Sans',
          j: ALIGN_MAP[el.textAlign] ?? 0,
          lh: el.fontSize * (el.lineHeight || 1.2),
          ls: el.letterSpacing || 0,
          fc: [1, 1, 1, 1],   // falls back to fills; we just set white here
        },
      }],
    },
    p: { a: 0, k: {} },
    m: { a: 0, k: {} },
    a: [],
  }

  return {
    ty: 5,
    ind: 0,
    ip: 0, op: totalFrames, st: 0,
    nm: el.name || 'Text',
    sr: 1, ao: 0,
    ks,
    t: textData,
  }
}
