<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import Select from '@/ui/Select.vue'

const props = defineProps<{ elementId: string }>()

const doc = useDocumentStore()
const selection = useSelectionStore()
const history = useHistoryStore()

const el = computed(() => {
  const e = doc.elementById(props.elementId)
  return e?.type === 'group' && e.hasMask ? e : null
})

const maskShapeId = computed(() => el.value?.childIds[0] ?? '')

const maskShapeOptions = computed(() =>
  (el.value?.childIds ?? []).map((id) => {
    const child = doc.elementById(id)
    return { value: id, label: child ? `${child.type} — ${child.name}` : id }
  }),
)

function setMaskShape(newId: string): void {
  if (!el.value) return
  history.transact('Change mask shape', () => {
    doc.swapMaskShape(props.elementId, newId)
  })
}

function releaseMask(): void {
  if (!el.value) return
  history.transact('Release mask', () => {
    doc.ungroupElements(props.elementId)
    selection.clearSelection()
  })
}
</script>

<template>
  <CollapsibleSection v-if="el" title="Mask" :default-open="true">
    <Row>
      <Label>Mask shape</Label>
      <Select
        :model-value="maskShapeId"
        :options="maskShapeOptions"
        @update:model-value="setMaskShape"
      />
    </Row>
    <Row>
      <button
        type="button"
        class="h-input-sm px-2 text-xs text-danger border border-danger/40 rounded-sm hover:bg-danger-soft hover:border-danger transition-colors duration-[140ms]"
        @click="releaseMask"
      >
        Release Mask
      </button>
    </Row>
  </CollapsibleSection>
</template>
