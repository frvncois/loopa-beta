import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

export function useFrameActivation() {
  const doc       = useDocumentStore()
  const selection = useSelectionStore()
  const timeline  = useTimelineStore()

  function activateFrame(frameId: string): void {
    if (selection.activeFrameId === frameId) return
    timeline.stop()
    timeline.seek(0)
    selection.setActiveFrame(frameId)
    const frame = doc.frameById(frameId)
    if (frame) timeline.syncFromFrame(frame)
  }

  return { activateFrame }
}
