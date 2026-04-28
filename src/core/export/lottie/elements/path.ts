import type { PathElement, PathPoint } from '@/types/element'
import type { Track } from '@/types/track'
import type { MotionPath } from '@/types/motion-path'
import type { LottieShapeLayer } from '../types'
import { buildTransform } from '../tracks'
import { buildFills, buildStrokes, baseShapeLayer } from './shared'
import { computeTrackValueAt } from '@/core/animation/tracks'

function pointsToLottie(
  pts: PathPoint[],
  ox: number,
  oy: number,
): { i: number[][]; o: number[][]; v: number[][] } {
  const v: number[][] = []
  const i: number[][] = []
  const o: number[][] = []
  for (const p of pts) {
    v.push([p.x + ox, p.y + oy])
    i.push(p.handleIn  ? [p.handleIn.x  - p.x, p.handleIn.y  - p.y] : [0, 0])
    o.push(p.handleOut ? [p.handleOut.x - p.x, p.handleOut.y - p.y] : [0, 0])
  }
  return { i, o, v }
}

export function buildPath(
  el: PathElement,
  tracks: Track[],
  totalFrames: number,
  mp?: MotionPath | null,
  pathEl?: PathElement | null,
): LottieShapeLayer {
  // Path points are LOCAL (relative to element top-left); layer origin = element center
  const offsetX = -(el.width / 2)
  const offsetY = -(el.height / 2)

  const pointsTrack = tracks.find(t => t.property === 'points' && t.enabled)
  let shapeKs: unknown

  if (pointsTrack?.keyframes.length) {
    // Animated morphing path — bake per-frame
    const kfs: unknown[] = []
    for (let f = 0; f <= totalFrames; f++) {
      const val = computeTrackValueAt(pointsTrack, f)
      const pts = Array.isArray(val) ? (val as PathPoint[]) : el.points
      const lp  = pointsToLottie(pts, offsetX, offsetY)
      const kf: Record<string, unknown> = { t: f, s: [{ ...lp, c: el.closed }] }
      if (f < totalFrames) { kf['o'] = { x: [1], y: [1] }; kf['i'] = { x: [0], y: [0] } }
      kfs.push(kf)
    }
    shapeKs = { a: 1, k: kfs }
  } else {
    const lp = pointsToLottie(el.points, offsetX, offsetY)
    shapeKs = { a: 0, k: { ...lp, c: el.closed } }
  }

  const shape: unknown = { ty: 'sh', nm: 'Path', ks: shapeKs }
  const ks = buildTransform(el, tracks, totalFrames, mp, pathEl)

  return baseShapeLayer(el, 0, totalFrames, ks, [
    shape,
    ...buildFills(el, tracks),
    ...buildStrokes(el, tracks),
  ])
}
