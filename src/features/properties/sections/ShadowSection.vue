<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { generateId } from '@/core/utils/id'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconPlus } from '@/ui/icons'
import ShadowRow from './ShadowRow.vue'
import type { ShadowEntry } from '@/types/element'

const props = defineProps<{ elementId: string }>()
const doc = useDocumentStore()
const history = useHistoryStore()

const shadows = computed(() => doc.elementById(props.elementId)?.shadows ?? [])

function addShadow(): void {
  history.transact('Add shadow', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const newShadow: ShadowEntry = {
      id: generateId('shadow'),
      visible: true,
      color: '000000',
      opacity: 0.3,
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
    }
    doc.updateElement(props.elementId, { shadows: [...el.shadows, newShadow] })
  })
}

function removeShadow(index: number): void {
  history.transact('Remove shadow', () => {
    const el = doc.elementById(props.elementId)
    if (!el) return
    const next = [...el.shadows]
    next.splice(index, 1)
    doc.updateElement(props.elementId, { shadows: next })
  })
}
</script>

<template>
  <CollapsibleSection title="Shadow">
    <ShadowRow
      v-for="(shadow, i) in shadows"
      :key="shadow.id"
      :element-id="elementId"
      :index="i"
      @remove="removeShadow(i)"
    />
    <div class="flex justify-end mt-0.5">
      <IconButton size="sm" variant="ghost" title="Add shadow" @click="addShadow">
        <IconPlus />
      </IconButton>
    </div>
  </CollapsibleSection>
</template>
