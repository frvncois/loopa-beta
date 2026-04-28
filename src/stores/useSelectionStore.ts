import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectionStore = defineStore('selection', () => {
  const selectedIds = ref<Set<string>>(new Set())
  const selectedKeyframeIds = ref<Set<string>>(new Set())
  const hoveredId = ref<string | null>(null)
  const activeFrameId = ref<string | null>(null)
  const activeGroupId = ref<string | null>(null)
  const editingPathId = ref<string | null>(null)
  const pathEditMode = ref(false)

  function select(id: string): void {
    selectedIds.value = new Set([id])
  }

  function addToSelection(id: string): void {
    const next = new Set(selectedIds.value)
    next.add(id)
    selectedIds.value = next
  }

  function toggleSelection(id: string): void {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function selectMany(ids: string[]): void {
    selectedIds.value = new Set(ids)
  }

  function clearSelection(): void {
    selectedIds.value = new Set()
  }

  function selectKeyframe(id: string, multi = false): void {
    if (multi) {
      const next = new Set(selectedKeyframeIds.value)
      next.add(id)
      selectedKeyframeIds.value = next
    } else {
      selectedKeyframeIds.value = new Set([id])
    }
  }

  function clearKeyframeSelection(): void {
    selectedKeyframeIds.value = new Set()
  }

  function setHovered(id: string | null): void {
    hoveredId.value = id
  }

  function setActiveFrame(frameId: string): void {
    activeFrameId.value = frameId
    selectedIds.value = new Set()
  }

  function enterGroup(groupId: string): void {
    activeGroupId.value = groupId
  }

  function exitGroup(): void {
    activeGroupId.value = null
  }

  function enterPathEditMode(pathId: string): void {
    editingPathId.value = pathId
    pathEditMode.value = true
  }

  function exitPathEditMode(): void {
    editingPathId.value = null
    pathEditMode.value = false
  }

  return {
    selectedIds,
    selectedKeyframeIds,
    hoveredId,
    activeFrameId,
    activeGroupId,
    editingPathId,
    pathEditMode,
    select,
    addToSelection,
    toggleSelection,
    selectMany,
    clearSelection,
    selectKeyframe,
    clearKeyframeSelection,
    setHovered,
    setActiveFrame,
    enterGroup,
    exitGroup,
    enterPathEditMode,
    exitPathEditMode,
  }
})
