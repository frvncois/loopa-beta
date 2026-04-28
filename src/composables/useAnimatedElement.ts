import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { computeElementAt } from '@/core/animation/engine'
import { pointAtProgress } from '@/core/path/motionPathMath'
import type { PathElement } from '@/types/element'

/**
 * Returns a computed ref of the element with track values applied at currentFrame,
 * then optionally overridden by a motion path position.
 */
export function useAnimatedElement(elementId: MaybeRefOrGetter<string>) {
  const doc = useDocumentStore()
  const tl  = useTimelineStore()

  return computed(() => {
    const id   = toValue(elementId)
    const base = doc.elementById(id)
    if (!base) return null

    const tracks = doc.tracksForElement(id)
    let result = computeElementAt(base, tracks, tl.currentFrame)

    // Motion path override: replaces x/y (and optionally rotation)
    const mp = doc.motionPaths.find((m) => m.elementId === id)
    if (mp) {
      const frame = tl.currentFrame
      const range = mp.endFrame - mp.startFrame
      if (range > 0) {
        const inRange = frame >= mp.startFrame && frame <= mp.endFrame
        if (inRange || mp.loop) {
          const raw      = frame - mp.startFrame
          const progress = mp.loop
            ? ((raw % range) + range) % range / range
            : Math.max(0, Math.min(1, raw / range))

          // Animate the path element independently (it may have its own tracks)
          const pathBase   = doc.elementById(mp.pathElementId)
          const pathTracks = pathBase ? doc.tracksForElement(mp.pathElementId) : []
          const pathEl     = pathBase
            ? computeElementAt(pathBase, pathTracks, frame) as PathElement
            : null

          if (pathEl && pathEl.type === 'path' && pathEl.points.length > 0) {
            const { position, tangentAngle } = pointAtProgress(pathEl.points, pathEl.closed, progress)
            result = { ...result, x: pathEl.x + position.x, y: pathEl.y + position.y }
            if (mp.rotateAlongPath) {
              result = { ...result, rotation: tangentAngle }
            }
          }
        }
      }
    }

    return result
  })
}
