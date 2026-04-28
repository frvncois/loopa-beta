import type { Ref } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import type { Frame } from '@/types/frame'
import { generateId } from '@/core/utils/id'

export function createDuplicateActions(
  elements: Ref<Element[]>,
  frames: Ref<Frame[]>,
  tracks: Ref<Track[]>,
  elementById: (id: string) => Element | undefined,
  frameById: (id: string) => Frame | undefined,
) {
  function duplicateFrame(id: string): string {
    const frame = frameById(id)
    if (!frame) return ''
    const newId = generateId('frame')
    const elementIdMap = new Map<string, string>()

    for (const elId of frame.elementIds) {
      const el = elementById(elId)
      if (!el) continue
      const newElId = generateId('el')
      elementIdMap.set(elId, newElId)
      const cloned = structuredClone(el)
      cloned.id = newElId
      elements.value.push(cloned)
    }

    for (const track of tracks.value) {
      const newElId = elementIdMap.get(track.elementId)
      if (!newElId) continue
      tracks.value.push({
        ...structuredClone(track),
        id: generateId('track'),
        elementId: newElId,
        keyframes: track.keyframes.map((kf) => ({ ...kf, id: generateId('kf') })),
      })
    }

    frames.value.push({
      ...frame,
      id: newId,
      name: `${frame.name} copy`,
      order: frames.value.length,
      elementIds: frame.elementIds.map((eid) => elementIdMap.get(eid) ?? eid),
      canvasX: frame.canvasX + frame.width + 100,
    })
    return newId
  }

  function duplicateElements(ids: string[]): string[] {
    const newIds: string[] = []
    const idMap = new Map<string, string>()

    for (const id of ids) {
      const el = elementById(id)
      if (!el) continue
      const newId = generateId('el')
      idMap.set(id, newId)
      const cloned = structuredClone(el)
      cloned.id   = newId
      cloned.name = `${el.name} copy`
      cloned.x    = el.x + 20
      cloned.y    = el.y + 20
      elements.value.push(cloned)
      newIds.push(newId)

      for (const frame of frames.value) {
        if (frame.elementIds.includes(id)) {
          frame.elementIds.push(newId)
          break
        }
      }
    }

    for (const track of tracks.value) {
      const newElId = idMap.get(track.elementId)
      if (!newElId) continue
      tracks.value.push({
        ...structuredClone(track),
        id: generateId('track'),
        elementId: newElId,
        keyframes: track.keyframes.map((kf) => ({ ...kf, id: generateId('kf') })),
      })
    }

    return newIds
  }

  return { duplicateFrame, duplicateElements }
}
