import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

export interface ElementOverrides {
  x: boolean
  y: boolean
  rotation: boolean
}

/**
 * Returns which element properties are currently driven by a motion path
 * at the current timeline frame. Mirrors the same active-range logic as
 * useAnimatedElement so the two are always in sync.
 */
export function useElementOverrides(elementId: MaybeRefOrGetter<string>) {
  const doc = useDocumentStore()
  const tl  = useTimelineStore()

  return computed((): ElementOverrides => {
    const id = toValue(elementId)
    const mp = doc.motionPaths.find((m) => m.elementId === id)

    if (!mp) return { x: false, y: false, rotation: false }

    const range = mp.endFrame - mp.startFrame
    if (range <= 0) return { x: false, y: false, rotation: false }

    const frame  = tl.currentFrame
    const active = mp.loop || (frame >= mp.startFrame && frame <= mp.endFrame)
    if (!active) return { x: false, y: false, rotation: false }

    return { x: true, y: true, rotation: mp.rotateAlongPath }
  })
}
