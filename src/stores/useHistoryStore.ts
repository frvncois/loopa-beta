import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectData } from '@/types/project'
import { useDocumentStore } from './useDocumentStore'

interface HistorySnapshot {
  label: string
  data: ProjectData
  timestamp: number
}

const MAX_SNAPSHOTS = 100

export const useHistoryStore = defineStore('history', () => {
  const past = ref<HistorySnapshot[]>([])
  const future = ref<HistorySnapshot[]>([])
  const currentTransaction = ref<{ label: string; baseline: ProjectData } | null>(null)

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function snapshot(): ProjectData {
    return useDocumentStore().serialize()
  }

  function pushPast(entry: HistorySnapshot): void {
    past.value.push(entry)
    if (past.value.length > MAX_SNAPSHOTS) past.value.shift()
  }

  /** Capture initial state on project load. Clears undo/redo stacks. */
  function seed(): void {
    past.value = []
    future.value = []
    currentTransaction.value = null
  }

  /** Capture pre-state, run fn, push one snapshot. Clears redo stack. */
  function transact(label: string, fn: () => void): void {
    const baseline = snapshot()
    fn()
    future.value = []
    pushPast({ label, data: baseline, timestamp: Date.now() })
  }

  /** Capture pre-state and hold it until commit() or cancel(). */
  function beginTransaction(label: string): void {
    if (currentTransaction.value) return // already open; ignore nested begins
    currentTransaction.value = { label, baseline: snapshot() }
  }

  /** Push the held pre-state as one undo entry. No-op if no transaction open. */
  function commit(): void {
    if (!currentTransaction.value) return
    const { label, baseline } = currentTransaction.value
    currentTransaction.value = null
    future.value = []
    pushPast({ label, data: baseline, timestamp: Date.now() })
  }

  /** Restore pre-state and discard the transaction. Use for ESC during drag. */
  function cancel(): void {
    if (!currentTransaction.value) return
    const { baseline } = currentTransaction.value
    currentTransaction.value = null
    useDocumentStore().loadProject(baseline)
  }

  function undo(): void {
    if (!canUndo.value) return
    const doc = useDocumentStore()
    const entry = past.value.pop()
    if (!entry) return
    const current = snapshot()
    future.value.push({ label: entry.label, data: current, timestamp: Date.now() })
    doc.loadProject(entry.data)
  }

  function redo(): void {
    if (!canRedo.value) return
    const doc = useDocumentStore()
    const entry = future.value.pop()
    if (!entry) return
    const current = snapshot()
    pushPast({ label: entry.label, data: current, timestamp: Date.now() })
    doc.loadProject(entry.data)
  }

  function clear(): void {
    past.value = []
    future.value = []
    currentTransaction.value = null
  }

  function reset(): void {
    clear()
  }

  return {
    past,
    future,
    currentTransaction,
    canUndo,
    canRedo,
    seed,
    transact,
    beginTransaction,
    commit,
    cancel,
    undo,
    redo,
    clear,
    reset,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useHistoryStore, import.meta.hot))
