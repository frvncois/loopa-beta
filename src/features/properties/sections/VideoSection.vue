<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import type { VideoElement } from '@/types/element'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import Select from '@/ui/Select.vue'

const props = defineProps<{ elementId: string }>()

const doc     = useDocumentStore()
const history = useHistoryStore()

const element = computed(() => doc.elementById(props.elementId) as VideoElement | undefined)

const FIT_OPTIONS = [
  { value: 'cover',   label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill',    label: 'Fill' },
]

const fit = computed({
  get: () => element.value?.fit ?? 'cover',
  set: (v: string) => {
    history.transact('Video fit', () => {
      doc.updateElement(props.elementId, { fit: v as VideoElement['fit'] })
    })
  },
})

const trimStart = computed({
  get: () => element.value?.trimStart ?? 0,
  set: (v: number) => {
    const el = element.value
    if (!el) return
    history.transact('Video trim start', () => {
      doc.updateElement(props.elementId, { trimStart: Math.max(0, Math.min(v, el.trimEnd - 0.01)) })
    })
  },
})

const trimEnd = computed({
  get: () => element.value?.trimEnd ?? 0,
  set: (v: number) => {
    const el = element.value
    if (!el) return
    history.transact('Video trim end', () => {
      doc.updateElement(props.elementId, { trimEnd: Math.max(el.trimStart + 0.01, Math.min(v, el.duration)) })
    })
  },
})

const playbackRate = computed({
  get: () => element.value?.playbackRate ?? 1,
  set: (v: number) => {
    history.transact('Video playback rate', () => {
      doc.updateElement(props.elementId, { playbackRate: Math.max(0.1, Math.min(v, 4)) })
    })
  },
})
</script>

<template>
  <CollapsibleSection v-if="element" title="Video" :default-open="true">
    <Row>
      <Label>File</Label>
      <span class="flex-1 text-xs text-text-2 truncate" :title="element.fileName">
        {{ element.fileName }}
      </span>
    </Row>
    <Row>
      <Label>Fit</Label>
      <Select v-model="fit" :options="FIT_OPTIONS" />
    </Row>
    <Row>
      <Label>In</Label>
      <NumberField v-model="trimStart" :min="0" :step="0.1" :precision="2" />
      <Label>Out</Label>
      <NumberField v-model="trimEnd" :min="0" :step="0.1" :precision="2" />
    </Row>
    <Row>
      <Label>Speed</Label>
      <NumberField v-model="playbackRate" :min="0.1" :max="4" :step="0.1" :precision="2" />
    </Row>
  </CollapsibleSection>
</template>
