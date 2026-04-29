import type { Ref } from 'vue'
import type { Element, GroupElement } from '@/types/element'
import type { Artboard } from '@/types/artboard'
import { generateId } from '@/core/utils/id'
import { createDefaultElement } from '@/core/elements/factory'

export function createGroupMaskActions(
  elements: Ref<Element[]>,
  artboards: Ref<Artboard[]>,
  elementById: (id: string) => Element | undefined,
  artboardById: (id: string) => Artboard | undefined,
) {
  function groupElements(ids: string[]): string | null {
    if (ids.length < 2) return null
    const firstId = ids[0]!
    let artboardId: string | null = null
    for (const artboard of artboards.value) {
      if (artboard.elementIds.includes(firstId)) { artboardId = artboard.id; break }
    }
    if (!artboardId) return null

    const xs    = ids.map((id) => elementById(id)?.x ?? 0)
    const ys    = ids.map((id) => elementById(id)?.y ?? 0)
    const minX  = Math.min(...xs)
    const minY  = Math.min(...ys)

    const groupId = generateId('group')
    const group: GroupElement = {
      ...createDefaultElement('group'),
      id: groupId,
      name: 'Group',
      x: minX,
      y: minY,
      childIds: [...ids],
    }
    elements.value.push(group)

    const artboard = artboardById(artboardId)
    if (artboard) {
      const firstIdx = artboard.elementIds.indexOf(firstId)
      artboard.elementIds = artboard.elementIds.filter((id) => !ids.includes(id))
      artboard.elementIds.splice(
        firstIdx !== -1 ? Math.min(firstIdx, artboard.elementIds.length) : artboard.elementIds.length,
        0,
        groupId,
      )
    }
    return groupId
  }

  function ungroupElements(groupId: string): string[] {
    const group = elementById(groupId)
    if (!group || group.type !== 'group') return []
    const childIds = [...group.childIds]
    for (const artboard of artboards.value) {
      const idx = artboard.elementIds.indexOf(groupId)
      if (idx !== -1) { artboard.elementIds.splice(idx, 1, ...childIds); break }
    }
    elements.value = elements.value.filter((e) => e.id !== groupId)
    return childIds
  }

  function applyMask(ids: string[]): string | null {
    if (ids.length < 2) return null
    const firstId = ids[0]!
    let artboardId: string | null = null
    for (const artboard of artboards.value) {
      if (artboard.elementIds.includes(firstId)) { artboardId = artboard.id; break }
    }
    if (!artboardId) return null
    const artboard = artboardById(artboardId)
    if (!artboard || !ids.every((id) => artboard.elementIds.includes(id))) return null

    const sorted      = [...ids].sort((a, b) => artboard.elementIds.indexOf(a) - artboard.elementIds.indexOf(b))
    const maskShapeId = sorted[sorted.length - 1]!
    const childIds    = [maskShapeId, ...sorted.slice(0, -1)]

    const x1s = childIds.flatMap((id) => { const el = elementById(id); return el ? [el.x, el.x + el.width] : [] })
    const y1s = childIds.flatMap((id) => { const el = elementById(id); return el ? [el.y, el.y + el.height] : [] })
    const minX = Math.min(...x1s), maxX = Math.max(...x1s)
    const minY = Math.min(...y1s), maxY = Math.max(...y1s)

    const groupId = generateId('group')
    elements.value.push({
      ...createDefaultElement('group'),
      id: groupId, name: 'Mask Group',
      x: minX, y: minY, width: maxX - minX, height: maxY - minY,
      childIds, hasMask: true,
    } as GroupElement)

    const insertAt = artboard.elementIds.indexOf(sorted[0]!)
    artboard.elementIds = artboard.elementIds.filter((id) => !ids.includes(id))
    artboard.elementIds.splice(
      insertAt !== -1 ? Math.min(insertAt, artboard.elementIds.length) : artboard.elementIds.length,
      0, groupId,
    )
    return groupId
  }

  function swapMaskShape(groupId: string, newMaskId: string): void {
    const group = elementById(groupId)
    if (!group || group.type !== 'group' || !group.hasMask) return
    if (group.childIds[0] === newMaskId) return
    group.childIds = [newMaskId, ...group.childIds.filter((id) => id !== newMaskId)]
  }

  return { groupElements, ungroupElements, applyMask, swapMaskShape }
}
