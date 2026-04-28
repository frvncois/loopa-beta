import type { Track, KeyframeValue } from '@/types/track'
import { interpolate } from './interpolate'
import { getEasingFn } from './easing'

/**
 * Compute the value of a track at the given frame.
 * Returns undefined if the track has no keyframes.
 */
export function computeTrackValueAt(track: Track, frame: number): KeyframeValue | undefined {
  const kfs = track.keyframes
  if (kfs.length === 0) return undefined

  const first = kfs[0]
  const last = kfs[kfs.length - 1]
  if (first === undefined || last === undefined) return undefined

  if (frame <= first.frame) return first.value
  if (frame >= last.frame) return last.value

  // Find the surrounding keyframe pair
  let prev = first
  let next = kfs[1]
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (a === undefined || b === undefined) continue
    if (a.frame <= frame && b.frame >= frame) {
      prev = a
      next = b
      break
    }
  }

  if (next === undefined) return prev.value

  const span = next.frame - prev.frame
  if (span === 0) return prev.value

  const rawT = (frame - prev.frame) / span
  const t = getEasingFn(prev.easing)(rawT)
  return interpolate(prev.value, next.value, t, track.property)
}
