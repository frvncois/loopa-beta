<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { generateId } from '@/core/utils/id'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconPlus } from '@/ui/icons'
import StrokeRow from './StrokeRow.vue'
import type { StrokeEntry } from '@/types/element'

const props = defineProps<{ elementId: string }>()
const doc = useDocumentStore()
const history = useHistoryStore()

const strokes = computed(() => doc.elementById(props.elementId)?.strokes ?? [])

function addStroke(): void {
  history.transact('Add stroke', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const newStroke: StrokeEntry = {
      id: generateId('stroke'),
      visible: true,
      color: 'ffffff',
      width: 1,
      position: 'center',
      cap: 'butt',
      join: 'miter',
      dashArray: [],
      dashOffset: 0,
    }
    doc.updateElement(props.elementId, { strokes: [...el.strokes, newStroke] })
  })
}

function removeStroke(index: number): void {
  history.transact('Remove stroke', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const next = [...el.strokes]
    next.splice(index, 1)
    doc.updateElement(props.elementId, { strokes: next })
  })
}
</script>

<template>
  <CollapsibleSection title="Stroke">
    <StrokeRow
      v-for="(stroke, i) in strokes"
      :key="stroke.id"
      :element-id="elementId"
      :index="i"
      @remove="removeStroke(i)"
    />
    <div class="flex justify-end mt-0.5">
      <IconButton size="sm" variant="ghost" title="Add stroke" @click="addStroke">
        <IconPlus />
      </IconButton>
    </div>
  </CollapsibleSection>
</template>
