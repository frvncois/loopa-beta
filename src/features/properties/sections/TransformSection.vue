<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import { useElementOverrides } from '@/composables/useElementOverrides'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconFlipH, IconFlipV, IconMotionPath } from '@/ui/icons'

const props = defineProps<{ elementId: string }>()
const eid = computed(() => props.elementId)
const doc = useDocumentStore()
const history = useHistoryStore()

const { value: rotation, hasChangedFromInitial: rotChanged, resetToInitial: rotReset } = useAnimatedProperty<number>(eid, ref('rotation'))
const { value: scaleX,   hasChangedFromInitial: sxChanged,  resetToInitial: sxReset  } = useAnimatedProperty<number>(eid, ref('scaleX'))
const { value: scaleY,   hasChangedFromInitial: syChanged,  resetToInitial: syReset  } = useAnimatedProperty<number>(eid, ref('scaleY'))

const el        = computed(() => doc.elementById(eid.value))
const overrides = useElementOverrides(eid)

function toggleFlip(axis: 'flipX' | 'flipY'): void {
  const current = el.value
  if (!current) return
  history.transact(`Flip ${axis}`, () => { doc.updateElement(eid.value, { [axis]: !current[axis] }) })
}
</script>

<template>
  <CollapsibleSection title="Transform">
    <Row :title="overrides.rotation ? 'Driven by motion path' : undefined">
      <Label>Rotate</Label>
      <IconMotionPath v-if="overrides.rotation" class="flex-shrink-0 w-3 h-3 text-text-3" />
      <NumberField v-model="rotation" :step="1" :precision="1" unit="°" :disabled="overrides.rotation" />
      <button v-if="rotChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="rotReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>Scale X</Label>
      <NumberField v-model="scaleX" :step="0.01" :precision="2" :min="0" />
      <button v-if="sxChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="sxReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>Scale Y</Label>
      <NumberField v-model="scaleY" :step="0.01" :precision="2" :min="0" />
      <button v-if="syChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="syReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>Flip</Label>
      <div class="flex gap-1">
        <IconButton size="sm" variant="ghost" :active="el?.flipX ?? false" title="Flip H" @click="toggleFlip('flipX')"><IconFlipH /></IconButton>
        <IconButton size="sm" variant="ghost" :active="el?.flipY ?? false" title="Flip V" @click="toggleFlip('flipV')"><IconFlipV /></IconButton>
      </div>
    </Row>
  </CollapsibleSection>
</template>
