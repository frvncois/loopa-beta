import type { Ref } from 'vue'
import type { Element, GroupElement } from '@/types/element'
import type { Frame } from '@/types/frame'
import { generateId } from '@/core/utils/id'
import { createDefaultElement } from '@/core/elements/factory'

export function createGroupMaskActions(
  elements: Ref<Element[]>,
  frames: Ref<Frame[]>,
  elementById: (id: string) => Element | undefined,
  frameById: (id: string) => Frame | undefined,
) {
  function groupElements(ids: string[]): string | null {
    if (ids.length < 2) return null
    const firstId = ids[0]!
    let frameId: string | null = null
    for (const frame of frames.value) {
      if (frame.elementIds.includes(firstId)) { frameId = frame.id; break }
    }
    if (!frameId) return null

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

    const frame = frameById(frameId)
    if (frame) {
      const firstIdx = frame.elementIds.indexOf(firstId)
      frame.elementIds = frame.elementIds.filter((id) => !ids.includes(id))
      frame.elementIds.splice(
        firstIdx !== -1 ? Math.min(firstIdx, frame.elementIds.length) : frame.elementIds.length,
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
    for (const frame of frames.value) {
      const idx = frame.elementIds.indexOf(groupId)
      if (idx !== -1) { frame.elementIds.splice(idx, 1, ...childIds); break }
    }
    elements.value = elements.value.filter((e) => e.id !== groupId)
    return childIds
  }

  function applyMask(ids: string[]): string | null {
    if (ids.length < 2) return null
    const firstId = ids[0]!
    let frameId: string | null = null
    for (const frame of frames.value) {
      if (frame.elementIds.includes(firstId)) { frameId = frame.id; break }
    }
    if (!frameId) return null
    const frame = frameById(frameId)
    if (!frame || !ids.every((id) => frame.elementIds.includes(id))) return null

    const sorted     = [...ids].sort((a, b) => frame.elementIds.indexOf(a) - frame.elementIds.indexOf(b))
    const maskShapeId = sorted[sorted.length - 1]!
    const childIds   = [maskShapeId, ...sorted.slice(0, -1)]

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

    const insertAt = frame.elementIds.indexOf(sorted[0]!)
    frame.elementIds = frame.elementIds.filter((id) => !ids.includes(id))
    frame.elementIds.splice(
      insertAt !== -1 ? Math.min(insertAt, frame.elementIds.length) : frame.elementIds.length,
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
