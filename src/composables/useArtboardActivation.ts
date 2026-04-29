import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

export function useArtboardActivation() {
  const doc       = useDocumentStore()
  const selection = useSelectionStore()
  const timeline  = useTimelineStore()

  function activateArtboard(artboardId: string): void {
    if (selection.activeArtboardId === artboardId) return
    timeline.stop()
    timeline.seek(0)
    selection.setActiveArtboard(artboardId)
    const artboard = doc.artboardById(artboardId)
    if (artboard) timeline.syncFromArtboard(artboard)
  }

  return { activateArtboard }
}
