<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { generateId } from '@/core/utils/id'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconPlus } from '@/ui/icons'
import FillRow from './FillRow.vue'
import type { FillEntry } from '@/types/element'

const props = defineProps<{ elementId: string }>()
const doc = useDocumentStore()
const history = useHistoryStore()

const fills = computed(() => doc.elementById(props.elementId)?.fills ?? [])

function addFill(): void {
  history.transact('Add fill', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const newFill: FillEntry = {
      id: generateId('fill'),
      visible: true,
      type: 'solid',
      color: 'ffffff',
      opacity: 1,
    }
    doc.updateElement(props.elementId, { fills: [...el.fills, newFill] })
  })
}

function removeFill(index: number): void {
  history.transact('Remove fill', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const next = [...el.fills]
    next.splice(index, 1)
    doc.updateElement(props.elementId, { fills: next })
  })
}
</script>

<template>
  <CollapsibleSection title="Fill" :default-open="true">
    <FillRow
      v-for="(fill, i) in fills"
      :key="fill.id"
      :element-id="elementId"
      :index="i"
      @remove="removeFill(i)"
    />
    <div class="flex justify-end mt-0.5">
      <IconButton size="sm" variant="ghost" title="Add fill" @click="addFill">
        <IconPlus />
      </IconButton>
    </div>
  </CollapsibleSection>
</template>
