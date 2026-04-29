import { ref, readonly } from 'vue'

// Module-level singleton — shared across all timeline rows and composables
const _selectedIds = ref(new Set<string>())

export function useKeyframeSelection() {
  function select(ids: string[]): void {
    _selectedIds.value = new Set(ids)
  }

  function addToSelection(ids: string[]): void {
    const next = new Set(_selectedIds.value)
    for (const id of ids) next.add(id)
    _selectedIds.value = next
  }

  function clear(): void {
    _selectedIds.value = new Set()
  }

  function isSelected(id: string): boolean {
    return _selectedIds.value.has(id)
  }

  return { selectedIds: readonly(_selectedIds), select, addToSelection, clear, isSelected }
}
