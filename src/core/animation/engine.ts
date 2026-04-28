import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { computeTrackValueAt } from './tracks'
import { setValueAtPath } from '@/core/utils/valueAtPath'
import { deepClone } from '@/core/utils/deepClone'

/**
 * Pure function: given an element and its tracks, compute the element state at a specific frame.
 * Returns a NEW element (does not mutate input).
 */
export function computeElementAt(element: Element, tracks: Track[], frame: number): Element {
  const elementTracks = tracks.filter((t) => t.elementId === element.id && t.enabled)
  if (elementTracks.length === 0) return element

  const next = deepClone(element)

  for (const track of elementTracks) {
    if (track.keyframes.length === 0) continue
    const value = computeTrackValueAt(track, frame)
    if (value === undefined) continue
    setValueAtPath(next, track.property, value)
  }

  return next
}
