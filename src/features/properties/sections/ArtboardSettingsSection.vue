<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import Select from '@/ui/Select.vue'
import Toggle from '@/ui/Toggle.vue'
import ColorField from '@/ui/ColorField.vue'
import type { Artboard } from '@/types/artboard'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const timeline  = useTimelineStore()
const history   = useHistoryStore()

const artboard = computed(() => {
  const id = selection.activeArtboardId
  return id ? doc.artboardById(id) : undefined
})

function set<K extends keyof Artboard>(key: K, value: Artboard[K]): void {
  if (!artboard.value) return
  const id = artboard.value.id
  history.transact('Edit artboard', () => {
    doc.updateArtboard(id, { [key]: value } as Partial<Artboard>)
  })
  // Keep timeline in sync for playback-related props
  if (key === 'fps' || key === 'totalFrames' || key === 'loop' || key === 'direction') {
    const updated = doc.artboardById(id)
    if (updated) timeline.syncFromArtboard(updated)
  }
}

const DIRECTION_OPTIONS = [
  { value: 'normal',            label: 'Normal' },
  { value: 'reverse',           label: 'Reverse' },
  { value: 'alternate',         label: 'Alternate' },
  { value: 'alternate-reverse', label: 'Alt. reverse' },
]
</script>

<template>
  <template v-if="artboard">
    <CollapsibleSection title="Artboard" :default-open="true">
      <Row>
        <Label>W</Label>
        <NumberField :model-value="artboard.width"  :min="1" :step="1" :precision="0"
          @update:model-value="set('width', $event)" />
      </Row>
      <Row>
        <Label>H</Label>
        <NumberField :model-value="artboard.height" :min="1" :step="1" :precision="0"
          @update:model-value="set('height', $event)" />
      </Row>
      <Row>
        <Label>BG</Label>
        <ColorField :model-value="artboard.backgroundColor"
          @update:model-value="set('backgroundColor', $event)" />
      </Row>
    </CollapsibleSection>

    <CollapsibleSection title="Playback" :default-open="true">
      <Row>
        <Label>FPS</Label>
        <NumberField :model-value="artboard.fps" :min="1" :max="120" :step="1" :precision="0"
          @update:model-value="set('fps', $event)" />
      </Row>
      <Row>
        <Label>Frames</Label>
        <NumberField :model-value="artboard.totalFrames" :min="1" :step="1" :precision="0"
          @update:model-value="set('totalFrames', $event)" />
      </Row>
      <Row>
        <Label>Direction</Label>
        <Select :model-value="artboard.direction" :options="DIRECTION_OPTIONS"
          @update:model-value="set('direction', $event as Artboard['direction'])" />
      </Row>
      <Row>
        <Label>Loop</Label>
        <Toggle :model-value="artboard.loop"
          @update:model-value="set('loop', $event)" />
      </Row>
    </CollapsibleSection>
  </template>
</template>
