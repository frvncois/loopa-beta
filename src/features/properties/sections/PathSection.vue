<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import Select from '@/ui/Select.vue'
import Toggle from '@/ui/Toggle.vue'

const props = defineProps<{ elementId: string }>()

const doc     = useDocumentStore()
const history = useHistoryStore()

const el = computed(() => {
  const e = doc.elementById(props.elementId)
  return e?.type === 'path' ? e : null
})

const FILL_RULE_OPTIONS = [
  { value: 'nonzero', label: 'Non-zero' },
  { value: 'evenodd', label: 'Even-odd' },
]

function setClosed(v: boolean): void {
  if (!el.value) return
  history.transact('Toggle path closed', () => {
    doc.updateElement(props.elementId, { closed: v })
  })
}

function setFillRule(v: string): void {
  if (!el.value) return
  history.transact('Set fill rule', () => {
    doc.updateElement(props.elementId, { fillRule: v as 'nonzero' | 'evenodd' })
  })
}
</script>

<template>
  <CollapsibleSection v-if="el" title="Path" :default-open="true">
    <Row>
      <Label>Points</Label>
      <span class="flex-1 text-xs text-text-3 font-mono">{{ el.points.length }}</span>
    </Row>
    <Row>
      <Label>Closed</Label>
      <Toggle :model-value="el.closed" @update:model-value="setClosed" />
    </Row>
    <Row>
      <Label>Fill rule</Label>
      <Select :model-value="el.fillRule" :options="FILL_RULE_OPTIONS" @update:model-value="setFillRule" />
    </Row>
  </CollapsibleSection>
</template>
