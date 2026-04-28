import { computed, type ComputedRef } from 'vue'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import type { Element } from '@/types/element'

/**
 * Returns the first selected element and its id as reactive computed refs.
 * Used by all inspector sections as the source of truth for which element to show.
 */
export function usePrimarySelection(): {
  elementId: ComputedRef<string>
  element: ComputedRef<Element | null>
} {
  const selection = useSelectionStore()
  const doc = useDocumentStore()

  const elementId = computed((): string => {
    const first = [...selection.selectedIds][0]
    return first ?? ''
  })

  const element = computed((): Element | null => {
    if (!elementId.value) return null
    return doc.elementById(elementId.value) ?? null
  })

  return { elementId, element }
}
