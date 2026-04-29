<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import Select from '@/ui/Select.vue'

const props = defineProps<{ elementId: string }>()
const eid = computed(() => props.elementId)

const { value: opacity, hasChangedFromInitial: opChanged, resetToInitial: opReset } = useAnimatedProperty<number>(eid, ref('opacity'))
const { value: blendMode } = useAnimatedProperty<string>(eid, ref('blendMode'))

const opacityPct = computed({
  get: () => Math.round(opacity.value * 100),
  set: (v: number) => { opacity.value = v / 100 },
})

const BLEND_OPTIONS = [
  { value: 'normal',   label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen',   label: 'Screen' },
  { value: 'overlay',  label: 'Overlay' },
  { value: 'darken',   label: 'Darken' },
  { value: 'lighten',  label: 'Lighten' },
]
</script>

<template>
  <CollapsibleSection title="Opacity">
    <Row>
      <Label>Opacity</Label>
      <NumberField v-model="opacityPct" :min="0" :max="100" :step="1" unit="%" />
      <button v-if="opChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="opReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>Blend</Label>
      <Select v-model="blendMode" :options="BLEND_OPTIONS" />
    </Row>
  </CollapsibleSection>
</template>
