import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Element, GroupElement, PathElement, ImageElement, VideoElement } from '@/types/element'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import type { Track, PropertyPath } from '@/types/track'
import type { Frame } from '@/types/frame'
import type { MotionPath } from '@/types/motion-path'
import type { ProjectData, ProjectMeta } from '@/types/project'
import { generateId } from '@/core/utils/id'
import { LocalProjectRepo } from '@/core/persistence/LocalProjectRepo'
import { createTrackActions } from './documentTrackActions'
import { createGroupMaskActions } from './documentMaskActions'
import { createDuplicateActions } from './documentDuplicateActions'

const repo      = new LocalProjectRepo()
const mediaRepo = new IDBMediaRepo()

export const useDocumentStore = defineStore('document', () => {
  const projectId   = ref<string | null>(null)
  const meta        = ref<ProjectMeta | null>(null)
  const frames      = ref<Frame[]>([])
  const elements    = ref<Element[]>([])
  const tracks      = ref<Track[]>([])
  const motionPaths = ref<MotionPath[]>([])

  // ── Getters ──────────────────────────────────────────────────────────────

  function elementById(id: string): Element | undefined {
    return elements.value.find((e) => e.id === id)
  }

  function elementsByIds(ids: string[]): Element[] {
    const set = new Set(ids)
    return elements.value.filter((e) => set.has(e.id))
  }

  function frameById(id: string): Frame | undefined {
    return frames.value.find((f) => f.id === id)
  }

  function tracksForElement(elementId: string): Track[] {
    return tracks.value.filter((t) => t.elementId === elementId)
  }

  function trackForProperty(elementId: string, property: PropertyPath): Track | undefined {
    return tracks.value.find((t) => t.elementId === elementId && t.property === property)
  }

  function elementsForFrame(frameId: string): Element[] {
    const frame = frameById(frameId)
    if (!frame) return []
    const idSet = new Set(frame.elementIds)
    return elements.value.filter((e) => idSet.has(e.id))
  }

  function topLevelElementsForFrame(frameId: string): Element[] {
    const allChildren = new Set(
      elements.value
        .filter((e): e is GroupElement => e.type === 'group')
        .flatMap((e) => e.childIds),
    )
    return elementsForFrame(frameId).filter(
      (e) => !allChildren.has(e.id) && !(e.type === 'path' && (e as PathElement).isMotionPath),
    )
  }

  const childToGroupMap = computed((): Map<string, string> => {
    const map = new Map<string, string>()
    for (const el of elements.value) {
      if (el.type === 'group') {
        for (const childId of el.childIds) map.set(childId, el.id)
      }
    }
    return map
  })

  const elementToFrameMap = computed((): Map<string, string> => {
    const map = new Map<string, string>()
    for (const frame of frames.value) {
      for (const elId of frame.elementIds) map.set(elId, frame.id)
    }
    return map
  })

  // ── Action factories ──────────────────────────────────────────────────────

  const trackActions   = createTrackActions(tracks, trackForProperty)
  const groupMaskActs  = createGroupMaskActions(elements, frames, elementById, frameById)
  const duplicateActs  = createDuplicateActions(elements, frames, tracks, elementById, frameById)

  // ── Project ───────────────────────────────────────────────────────────────

  function loadProject(data: ProjectData): void {
    projectId.value   = data.meta.id
    meta.value        = data.meta
    frames.value      = data.frames
    elements.value    = data.elements
    tracks.value      = data.tracks
    motionPaths.value = data.motionPaths
  }

  function clearProject(): void {
    projectId.value = null; meta.value = null
    frames.value = []; elements.value = []; tracks.value = []; motionPaths.value = []
  }

  function serialize(): ProjectData {
    return JSON.parse(JSON.stringify({
      meta: meta.value ?? { id: projectId.value ?? generateId('proj'), name: 'Untitled', createdAt: Date.now(), updatedAt: Date.now(), thumbnail: null },
      frames: frames.value,
      elements: elements.value,
      tracks: tracks.value,
      motionPaths: motionPaths.value,
      schemaVersion: 3,
    })) as ProjectData
  }

  // ── Frame actions ─────────────────────────────────────────────────────────

  function addFrame(name?: string, width?: number, height?: number): string {
    const id = generateId('frame')
    let canvasX = 0
    for (const f of frames.value) canvasX = Math.max(canvasX, f.canvasX + f.width + 200)
    frames.value.push({
      id, name: name ?? `Frame ${frames.value.length + 1}`,
      width: width ?? 1280, height: height ?? 720,
      backgroundColor: '1a1a2e', elementIds: [],
      order: frames.value.length, fps: 30, totalFrames: 60,
      loop: true, direction: 'normal', canvasX, canvasY: 0,
    })
    return id
  }

  function updateFrame(id: string, updates: Partial<Frame>): void {
    const frame = frameById(id)
    if (frame) Object.assign(frame, updates)
  }

  function deleteFrame(id: string): void {
    const frame = frameById(id)
    if (frame) deleteElements(frame.elementIds.slice())
    frames.value = frames.value.filter((f) => f.id !== id)
  }

  function reorderFrame(id: string, newIndex: number): void {
    const idx = frames.value.findIndex((f) => f.id === id)
    if (idx === -1) return
    const [frame] = frames.value.splice(idx, 1)
    if (frame === undefined) return
    frames.value.splice(newIndex, 0, frame)
    frames.value.forEach((f, i) => { f.order = i })
  }

  // ── Element actions ───────────────────────────────────────────────────────

  function addElement(element: Element, frameId: string): void {
    elements.value.push(element)
    const frame = frameById(frameId)
    if (frame) frame.elementIds.push(element.id)
  }

  function updateElement(id: string, updates: Partial<Element>): void {
    const existing = elements.value.find((e) => e.id === id)
    if (!existing) return
    if (existing.type === 'group' && ('x' in updates || 'y' in updates)) {
      const dx = (updates.x ?? existing.x) - existing.x
      const dy = (updates.y ?? existing.y) - existing.y
      if (dx !== 0 || dy !== 0) {
        for (const childId of existing.childIds) {
          const child = elements.value.find((e) => e.id === childId)
          if (child) { child.x += dx; child.y += dy }
        }
      }
    }
    Object.assign(existing, updates)
  }

  function deleteElements(ids: string[]): void {
    if (ids.length === 0) return
    const toDelete = new Set<string>()
    const queue = [...ids]
    while (queue.length > 0) {
      const id = queue.shift()
      if (!id || toDelete.has(id)) continue
      toDelete.add(id)
      const el = elementById(id)
      if (el?.type === 'group') queue.push(...el.childIds)
    }

    const orphanedMediaIds: string[] = []
    for (const el of elements.value) {
      if (!toDelete.has(el.id)) continue
      if (el.type === 'image') orphanedMediaIds.push((el as ImageElement).imageStorageId)
      else if (el.type === 'video') orphanedMediaIds.push((el as VideoElement).videoStorageId)
    }

    elements.value = elements.value.filter((e) => !toDelete.has(e.id))
    for (const frame of frames.value) {
      frame.elementIds = frame.elementIds.filter((id) => !toDelete.has(id))
    }
    for (const el of elements.value) {
      if (el.type === 'group') el.childIds = el.childIds.filter((id) => !toDelete.has(id))
    }
    tracks.value      = tracks.value.filter((t) => !toDelete.has(t.elementId))
    motionPaths.value = motionPaths.value.filter(
      (mp) => !toDelete.has(mp.elementId) && !toDelete.has(mp.pathElementId),
    )
    if (orphanedMediaIds.length > 0) void mediaRepo.deleteMany(orphanedMediaIds)
  }

  function bringToFront(id: string): void {
    for (const frame of frames.value) {
      const idx = frame.elementIds.indexOf(id)
      if (idx !== -1) { frame.elementIds.splice(idx, 1); frame.elementIds.push(id); return }
    }
  }

  function sendToBack(id: string): void {
    for (const frame of frames.value) {
      const idx = frame.elementIds.indexOf(id)
      if (idx !== -1) { frame.elementIds.splice(idx, 1); frame.elementIds.unshift(id); return }
    }
  }

  function reorderElement(id: string, newIndex: number): void {
    for (const frame of frames.value) {
      const idx = frame.elementIds.indexOf(id)
      if (idx !== -1) {
        frame.elementIds.splice(idx, 1)
        frame.elementIds.splice(newIndex, 0, id)
        return
      }
    }
  }

  function moveElementsToFrame(ids: string[], frameId: string): void {
    const targetFrame = frameById(frameId)
    if (!targetFrame) return
    for (const id of ids) {
      for (const frame of frames.value) {
        const idx = frame.elementIds.indexOf(id)
        if (idx !== -1) { frame.elementIds.splice(idx, 1); break }
      }
      targetFrame.elementIds.push(id)
    }
  }

  // ── Motion path actions ───────────────────────────────────────────────────

  function addMotionPath(mp: MotionPath): void {
    const idx = motionPaths.value.findIndex((m) => m.elementId === mp.elementId)
    if (idx !== -1) motionPaths.value[idx] = mp
    else motionPaths.value.push(mp)
  }

  function updateMotionPath(id: string, updates: Partial<MotionPath>): void {
    const mp = motionPaths.value.find((m) => m.id === id)
    if (mp) Object.assign(mp, updates)
  }

  function deleteMotionPath(id: string): void {
    motionPaths.value = motionPaths.value.filter((m) => m.id !== id)
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  function updateMeta(updates: Partial<{ name: string }>): void {
    if (meta.value) Object.assign(meta.value, updates)
  }

  async function deleteProject(): Promise<void> {
    const id = projectId.value
    if (id) await repo.delete(id)
    clearProject()
  }

  async function saveProject(): Promise<void> {
    const data = serialize()
    if (meta.value) meta.value.updatedAt = Date.now()
    await repo.save(data.meta.id, data)
  }

  async function loadProjectById(id: string): Promise<boolean> {
    const data = await repo.load(id)
    if (!data) return false
    loadProject(data)
    return true
  }

  return {
    projectId, meta, frames, elements, tracks, motionPaths,
    childToGroupMap, elementToFrameMap,
    elementById, elementsByIds, frameById, tracksForElement, trackForProperty,
    elementsForFrame, topLevelElementsForFrame,
    loadProject, clearProject, serialize,
    addFrame, updateFrame, deleteFrame, duplicateFrame: duplicateActs.duplicateFrame, reorderFrame,
    addElement, updateElement, deleteElements,
    bringToFront, sendToBack, reorderElement,
    duplicateElements: duplicateActs.duplicateElements,
    groupElements: groupMaskActs.groupElements,
    ungroupElements: groupMaskActs.ungroupElements,
    applyMask: groupMaskActs.applyMask,
    swapMaskShape: groupMaskActs.swapMaskShape,
    moveElementsToFrame,
    addTrack: trackActions.addTrack,
    upsertKeyframe: trackActions.upsertKeyframe,
    deleteKeyframe: trackActions.deleteKeyframe,
    deleteTracksForElement: trackActions.deleteTracksForElement,
    setTrackEnabled: trackActions.setTrackEnabled,
    addMotionPath, updateMotionPath, deleteMotionPath,
    updateMeta, deleteProject, saveProject, loadProjectById,
  }
})
