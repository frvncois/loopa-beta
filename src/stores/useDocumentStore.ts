import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type { Element, GroupElement, PathElement, ImageElement, VideoElement } from '@/types/element'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import type { Track, PropertyPath } from '@/types/track'
import type { Artboard } from '@/types/artboard'
import type { MotionPath } from '@/types/motion-path'
import type { ProjectData, ProjectMeta } from '@/types/project'
import type { DocumentLocation, SaveStatus } from '@/types/cloud'
import { generateId } from '@/core/utils/id'
import { LocalProjectRepo } from '@/core/persistence/LocalProjectRepo'
import { RemoteProjectRepo } from '@/core/persistence/RemoteProjectRepo'
import { createTrackActions } from './documentTrackActions'
import { createGroupMaskActions } from './documentMaskActions'
import { createDuplicateActions } from './documentDuplicateActions'
import { useTimelineStore } from './useTimelineStore'
import { useSelectionStore } from './useSelectionStore'
import { useHistoryStore } from './useHistoryStore'
import { useViewportStore } from './useViewportStore'

const repo       = new LocalProjectRepo()
const mediaRepo  = new IDBMediaRepo()
const cloudRepo  = new RemoteProjectRepo()

export const useDocumentStore = defineStore('document', () => {
  const projectId   = ref<string | null>(null)
  const meta        = ref<ProjectMeta | null>(null)
  const artboards   = ref<Artboard[]>([])
  const elements    = ref<Element[]>([])
  const tracks      = ref<Track[]>([])
  const motionPaths = ref<MotionPath[]>([])

  // ── Cloud / save state ────────────────────────────────────────────────────

  const location          = ref<DocumentLocation>('none')
  const slug              = ref<string | null>(null)
  const cloudProjectId    = ref<string | null>(null)
  const isDirty           = ref(false)
  const saveStatus        = ref<SaveStatus>('clean')
  const lastServerVersion = ref<number | null>(null)

  function markDirty(): void {
    isDirty.value = true
    if (saveStatus.value === 'clean' || saveStatus.value === 'saved') {
      saveStatus.value = 'dirty'
    }
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  function elementById(id: string): Element | undefined {
    return elements.value.find((e) => e.id === id)
  }

  function elementsByIds(ids: string[]): Element[] {
    const set = new Set(ids)
    return elements.value.filter((e) => set.has(e.id))
  }

  function artboardById(id: string): Artboard | undefined {
    return artboards.value.find((a) => a.id === id)
  }

  function tracksForElement(elementId: string): Track[] {
    return tracks.value.filter((t) => t.elementId === elementId)
  }

  function trackForProperty(elementId: string, property: PropertyPath): Track | undefined {
    return tracks.value.find((t) => t.elementId === elementId && t.property === property)
  }

  function elementsForArtboard(artboardId: string): Element[] {
    const artboard = artboardById(artboardId)
    if (!artboard) return []
    const idSet = new Set(artboard.elementIds)
    return elements.value.filter((e) => idSet.has(e.id))
  }

  function topLevelElementsForArtboard(artboardId: string): Element[] {
    const allChildren = new Set(
      elements.value
        .filter((e): e is GroupElement => e.type === 'group')
        .flatMap((e) => e.childIds),
    )
    return elementsForArtboard(artboardId).filter(
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

  const elementToArtboardMap = computed((): Map<string, string> => {
    const map = new Map<string, string>()
    for (const artboard of artboards.value) {
      for (const elId of artboard.elementIds) map.set(elId, artboard.id)
    }
    return map
  })

  // ── Action factories ──────────────────────────────────────────────────────

  const trackActions   = createTrackActions(tracks, trackForProperty)
  const groupMaskActs  = createGroupMaskActions(elements, artboards, elementById, artboardById)
  const duplicateActs  = createDuplicateActions(elements, artboards, tracks, elementById, artboardById)

  // Wrap factory actions so they also mark the document dirty
  function _dirty<T extends (...args: never[]) => unknown>(fn: T): T {
    return ((...args: Parameters<T>) => { markDirty(); return fn(...args) }) as T
  }

  // ── Project ───────────────────────────────────────────────────────────────

  function loadProject(data: ProjectData): void {
    projectId.value   = data.meta.id
    meta.value        = data.meta
    // Backward compat: projects saved before the rename stored artboards as 'frames'
    artboards.value   = data.artboards ?? (data as unknown as { frames: Artboard[] }).frames ?? []
    elements.value    = data.elements
    tracks.value      = data.tracks
    motionPaths.value = data.motionPaths
  }

  function clearProject(): void {
    projectId.value = null; meta.value = null
    artboards.value = []; elements.value = []; tracks.value = []; motionPaths.value = []
  }

  function serialize(): ProjectData {
    return JSON.parse(JSON.stringify({
      meta: meta.value ?? { id: projectId.value ?? generateId('proj'), name: 'Untitled', createdAt: Date.now(), updatedAt: Date.now(), thumbnail: null },
      artboards: artboards.value,
      elements: elements.value,
      tracks: tracks.value,
      motionPaths: motionPaths.value,
      schemaVersion: 3,
    })) as ProjectData
  }

  function _resetUIStores(): void {
    useTimelineStore().reset()
    useSelectionStore().reset()
    useHistoryStore().reset()
    useViewportStore().reset()
  }

  function initLocal(): void {
    _resetUIStores()
    location.value          = 'local'
    slug.value              = null
    cloudProjectId.value    = null
    isDirty.value           = false
    saveStatus.value        = 'clean'
    lastServerVersion.value = null
  }

  async function loadFromCloud(projectSlug: string): Promise<void> {
    _resetUIStores()
    const project = await cloudRepo.loadBySlug(projectSlug)
    if (!project) throw new Error(`Project not found: ${projectSlug}`)
    loadProject(project.data)
    location.value          = 'cloud'
    slug.value              = projectSlug
    cloudProjectId.value    = project.meta.id
    lastServerVersion.value = project.meta.version
    isDirty.value           = false
    saveStatus.value        = 'clean'
  }

  // ── Artboard actions ──────────────────────────────────────────────────────

  function addArtboard(name?: string, width?: number, height?: number): string {
    markDirty()
    const id = generateId('artboard')
    let canvasX = 0
    for (const a of artboards.value) canvasX = Math.max(canvasX, a.canvasX + a.width + 200)
    artboards.value.push({
      id, name: name ?? `Artboard ${artboards.value.length + 1}`,
      width: width ?? 1280, height: height ?? 720,
      backgroundColor: '1a1a2e', elementIds: [],
      order: artboards.value.length, fps: 30, totalFrames: 60,
      loop: true, direction: 'normal', canvasX, canvasY: 0,
    })
    return id
  }

  function updateArtboard(id: string, updates: Partial<Artboard>): void {
    markDirty()
    const artboard = artboardById(id)
    if (artboard) Object.assign(artboard, updates)
  }

  function deleteArtboard(id: string): void {
    markDirty()
    const artboard = artboardById(id)
    if (artboard) deleteElements(artboard.elementIds.slice())
    artboards.value = artboards.value.filter((a) => a.id !== id)
  }

  function reorderArtboard(id: string, newIndex: number): void {
    markDirty()
    const idx = artboards.value.findIndex((a) => a.id === id)
    if (idx === -1) return
    const [artboard] = artboards.value.splice(idx, 1)
    if (artboard === undefined) return
    artboards.value.splice(newIndex, 0, artboard)
    artboards.value.forEach((a, i) => { a.order = i })
  }

  // ── Element actions ───────────────────────────────────────────────────────

  function addElement(element: Element, artboardId: string): void {
    markDirty()
    elements.value.push(element)
    const artboard = artboardById(artboardId)
    if (artboard) artboard.elementIds.push(element.id)
  }

  function updateElement(id: string, updates: Partial<Element>): void {
    markDirty()
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
    markDirty()
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
    for (const artboard of artboards.value) {
      artboard.elementIds = artboard.elementIds.filter((id) => !toDelete.has(id))
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
    markDirty()
    for (const artboard of artboards.value) {
      const idx = artboard.elementIds.indexOf(id)
      if (idx !== -1) { artboard.elementIds.splice(idx, 1); artboard.elementIds.push(id); return }
    }
  }

  function sendToBack(id: string): void {
    markDirty()
    for (const artboard of artboards.value) {
      const idx = artboard.elementIds.indexOf(id)
      if (idx !== -1) { artboard.elementIds.splice(idx, 1); artboard.elementIds.unshift(id); return }
    }
  }

  function reorderElement(id: string, newIndex: number): void {
    markDirty()
    for (const artboard of artboards.value) {
      const idx = artboard.elementIds.indexOf(id)
      if (idx !== -1) {
        artboard.elementIds.splice(idx, 1)
        artboard.elementIds.splice(newIndex, 0, id)
        return
      }
    }
  }

  function moveElementsToArtboard(ids: string[], artboardId: string): void {
    markDirty()
    const targetArtboard = artboardById(artboardId)
    if (!targetArtboard) return
    for (const id of ids) {
      for (const artboard of artboards.value) {
        const idx = artboard.elementIds.indexOf(id)
        if (idx !== -1) { artboard.elementIds.splice(idx, 1); break }
      }
      targetArtboard.elementIds.push(id)
    }
  }

  // ── Motion path actions ───────────────────────────────────────────────────

  function addMotionPath(mp: MotionPath): void {
    markDirty()
    const idx = motionPaths.value.findIndex((m) => m.elementId === mp.elementId)
    if (idx !== -1) motionPaths.value[idx] = mp
    else motionPaths.value.push(mp)
  }

  function updateMotionPath(id: string, updates: Partial<MotionPath>): void {
    markDirty()
    const mp = motionPaths.value.find((m) => m.id === id)
    if (mp) Object.assign(mp, updates)
  }

  function deleteMotionPath(id: string): void {
    markDirty()
    motionPaths.value = motionPaths.value.filter((m) => m.id !== id)
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  function updateMeta(updates: Partial<{ name: string; thumbnail: string | null }>): void {
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
    projectId, meta, artboards, elements, tracks, motionPaths,
    location, slug, cloudProjectId, isDirty, saveStatus, lastServerVersion,
    childToGroupMap, elementToArtboardMap,
    elementById, elementsByIds, artboardById, tracksForElement, trackForProperty,
    elementsForArtboard, topLevelElementsForArtboard,
    markDirty,
    loadProject, clearProject, serialize, initLocal, loadFromCloud,
    addArtboard, updateArtboard, deleteArtboard, reorderArtboard,
    duplicateArtboard: _dirty(duplicateActs.duplicateArtboard),
    addElement, updateElement, deleteElements,
    bringToFront, sendToBack, reorderElement,
    duplicateElements: _dirty(duplicateActs.duplicateElements),
    groupElements:    _dirty(groupMaskActs.groupElements),
    ungroupElements:  _dirty(groupMaskActs.ungroupElements),
    applyMask:        _dirty(groupMaskActs.applyMask),
    swapMaskShape:    _dirty(groupMaskActs.swapMaskShape),
    moveElementsToArtboard,
    addTrack:              _dirty(trackActions.addTrack),
    upsertKeyframe:        _dirty(trackActions.upsertKeyframe),
    deleteKeyframe:        _dirty(trackActions.deleteKeyframe),
    deleteTracksForElement: _dirty(trackActions.deleteTracksForElement),
    setTrackEnabled:       _dirty(trackActions.setTrackEnabled),
    setKeyframeEasing:     _dirty(trackActions.setKeyframeEasing),
    addMotionPath, updateMotionPath, deleteMotionPath,
    updateMeta, deleteProject, saveProject, loadProjectById,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useDocumentStore, import.meta.hot))
