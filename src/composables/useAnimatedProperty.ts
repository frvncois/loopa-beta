import { computed, onBeforeUnmount, type Ref, type WritableComputedRef, type ComputedRef } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useKeyframeSelection } from './useKeyframeSelection'
import { useAnimatedElement } from './useAnimatedElement'
import { getValueAtPath, setValueAtPath } from '@/core/utils/valueAtPath'
import type { KeyframeValue, PropertyPath } from '@/types/track'
import type { Element } from '@/types/element'

// ── Module-level transaction ownership ────────────────────────────────────────
// Tracks which (elementId:property) key currently owns the open debounce transaction.
// When a different key mutates, the current transaction is flushed immediately so
// that editing X then Y produces two separate undo steps, not one.

let _txKey: string | null = null
let _txTimer: ReturnType<typeof setTimeout> | null = null

function _clearTimer(): void {
  if (_txTimer !== null) {
    clearTimeout(_txTimer)
    _txTimer = null
  }
}

function _scheduleCommit(history: ReturnType<typeof useHistoryStore>): void {
  _clearTimer()
  _txTimer = setTimeout(() => {
    _txTimer = null
    _txKey = null
    history.commit()
  }, 400)
}

// ── Nested property helper ─────────────────────────────────────────────────────

function applyNestedProperty(
  doc: ReturnType<typeof useDocumentStore>,
  id: string,
  path: PropertyPath,
  value: unknown,
): void {
  const segments = path.split('.')
  if (segments.length === 1) {
    doc.updateElement(id, { [path]: value } as Partial<Element>)
    return
  }
  const el = doc.elementById(id)
  if (!el) return
  const topKey = segments[0]!
  const topVal = (el as unknown as Record<string, unknown>)[topKey]
  const cloned = JSON.parse(JSON.stringify(topVal))
  setValueAtPath(cloned, segments.slice(1).join('.'), value)
  doc.updateElement(id, { [topKey]: cloned } as Partial<Element>)
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useAnimatedProperty<T = unknown>(
  elementId: Ref<string>,
  property: Ref<PropertyPath>,
): {
  value: WritableComputedRef<T>
  hasTrack: ComputedRef<boolean>
  hasKeyframeAtCurrentFrame: ComputedRef<boolean>
  hasChangedFromInitial: ComputedRef<boolean>
  resetToInitial: () => void
} {
  const doc     = useDocumentStore()
  const timeline = useTimelineStore()
  const history  = useHistoryStore()
  const kfSel    = useKeyframeSelection()
  const animated = useAnimatedElement(elementId)

  const hasTrack = computed(() =>
    doc.trackForProperty(elementId.value, property.value) != null,
  )

  const hasKeyframeAtCurrentFrame = computed(() => {
    const track = doc.trackForProperty(elementId.value, property.value)
    if (!track) return false
    return track.keyframes.some((kf) => kf.frame === Math.round(timeline.currentFrame))
  })

  const value = computed({
    get(): T {
      if (!animated.value) return undefined as unknown as T
      return getValueAtPath(animated.value, property.value) as T
    },
    set(newValue: T) {
      const id = elementId.value
      const path = property.value
      const key = `${id}:${path}`

      // If a DIFFERENT property owns the open transaction, flush it immediately
      // so this mutation starts a fresh undo step.
      if (_txKey !== null && _txKey !== key) {
        _clearTimer()
        history.commit()
        _txKey = null
      }

      // Open a new transaction if we don't already own one
      if (_txKey !== key && !history.currentTransaction) {
        history.beginTransaction(`Edit ${path}`)
        _txKey = key
      }

      if (hasTrack.value) {
        // If a keyframe on this track is selected, edit it in place rather than at currentFrame
        const track = doc.trackForProperty(id, path)
        const selectedKf = track?.keyframes.find(kf => kfSel.isSelected(kf.id))
        const targetFrame = selectedKf?.frame ?? Math.round(timeline.currentFrame)
        doc.upsertKeyframe(id, path, targetFrame, newValue as KeyframeValue)
      } else {
        applyNestedProperty(doc, id, path, newValue)
      }

      // Only schedule commit if this instance owns the transaction
      if (_txKey === key) {
        _scheduleCommit(history)
      }
    },
  }) as WritableComputedRef<T>

  // ── Bullet reset ────────────────────────────────────────────────────────────

  const hasChangedFromInitial = computed((): boolean => {
    if (!hasTrack.value) return false
    const track = doc.trackForProperty(elementId.value, property.value)
    if (!track || track.keyframes.length === 0) return false
    const firstValue = track.keyframes[0]!.value
    return JSON.stringify(value.value) !== JSON.stringify(firstValue)
  })

  function resetToInitial(): void {
    if (!hasChangedFromInitial.value) return
    const track = doc.trackForProperty(elementId.value, property.value)
    if (!track || track.keyframes.length === 0) return
    const initValue = track.keyframes[0]!.value
    const id   = elementId.value
    const path = property.value
    const selectedKf = track.keyframes.find(kf => kfSel.isSelected(kf.id))
    const targetFrame = selectedKf?.frame ?? Math.round(timeline.currentFrame)
    history.transact('Reset to initial', () => {
      doc.upsertKeyframe(id, path, targetFrame, initValue)
    })
  }

  onBeforeUnmount(() => {
    const key = `${elementId.value}:${property.value}`
    if (_txKey === key) {
      _clearTimer()
      history.commit()
      _txKey = null
    }
  })

  return { value, hasTrack, hasKeyframeAtCurrentFrame, hasChangedFromInitial, resetToInitial }
}
