import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { generateId } from '@/core/utils/id'
import { useDocumentStore } from './useDocumentStore'

interface ClipboardData {
  elements: Element[]
  tracks: Track[]
  sourceProjectId: string
  timestamp: number
}

export const useClipboardStore = defineStore('clipboard', () => {
  const data = ref<ClipboardData | null>(null)

  const hasPasteData = computed(() => data.value !== null)

  function copy(elementIds: string[]): void {
    const doc = useDocumentStore()
    const els = doc.elementsByIds(elementIds)
    if (els.length === 0) return

    const elementIdSet = new Set(els.map((e) => e.id))
    const clipTracks = doc.tracks.filter((t) => elementIdSet.has(t.elementId))

    // JSON round-trip strips Vue reactive Proxies before cloning.
    // structuredClone alone throws DOMException on Proxy objects.
    data.value = {
      elements: JSON.parse(JSON.stringify(els)) as Element[],
      tracks:   JSON.parse(JSON.stringify(clipTracks)) as Track[],
      sourceProjectId: doc.projectId ?? '',
      timestamp: Date.now(),
    }
  }

  function paste(targetFrameId: string): { elementIds: string[]; trackIds: string[] } {
    if (!data.value) return { elementIds: [], trackIds: [] }
    const doc = useDocumentStore()

    const isSameProject = data.value.sourceProjectId === doc.projectId
    const offset = isSameProject ? 20 : 0

    const idMap = new Map<string, string>()
    const newElementIds: string[] = []
    const newTrackIds: string[] = []

    for (const el of data.value.elements) {
      const newId = generateId('el')
      idMap.set(el.id, newId)
      const cloned = structuredClone(el)
      cloned.id = newId
      cloned.x = el.x + offset
      cloned.y = el.y + offset
      doc.addElement(cloned, targetFrameId)
      newElementIds.push(newId)
    }

    for (const track of data.value.tracks) {
      const newElId = idMap.get(track.elementId)
      if (!newElId) continue
      const newTrackId = generateId('track')
      const newTrack: Track = {
        ...structuredClone(track),
        id: newTrackId,
        elementId: newElId,
        keyframes: track.keyframes.map((kf) => ({ ...kf, id: generateId('kf') })),
      }
      doc.addTrack(newTrack)
      newTrackIds.push(newTrackId)
    }

    return { elementIds: newElementIds, trackIds: newTrackIds }
  }

  function clear(): void {
    data.value = null
  }

  return { data, hasPasteData, copy, paste, clear }
})
