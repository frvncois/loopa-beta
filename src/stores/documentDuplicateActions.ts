import type { Ref } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import type { Artboard } from '@/types/artboard'
import { generateId } from '@/core/utils/id'

export function createDuplicateActions(
  elements: Ref<Element[]>,
  artboards: Ref<Artboard[]>,
  tracks: Ref<Track[]>,
  elementById: (id: string) => Element | undefined,
  artboardById: (id: string) => Artboard | undefined,
) {
  function duplicateArtboard(id: string): string {
    const artboard = artboardById(id)
    if (!artboard) return ''
    const newId = generateId('artboard')
    const elementIdMap = new Map<string, string>()

    for (const elId of artboard.elementIds) {
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

    artboards.value.push({
      ...artboard,
      id: newId,
      name: `${artboard.name} copy`,
      order: artboards.value.length,
      elementIds: artboard.elementIds.map((eid) => elementIdMap.get(eid) ?? eid),
      canvasX: artboard.canvasX + artboard.width + 100,
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

      for (const artboard of artboards.value) {
        if (artboard.elementIds.includes(id)) {
          artboard.elementIds.push(newId)
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

  return { duplicateArtboard, duplicateElements }
}
