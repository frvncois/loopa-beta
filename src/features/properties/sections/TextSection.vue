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

const { value: fontSize }     = useAnimatedProperty<number>(eid, ref('fontSize'))
const { value: fontWeight }   = useAnimatedProperty<number>(eid, ref('fontWeight'))
const { value: lineHeight }   = useAnimatedProperty<number>(eid, ref('lineHeight'))
const { value: letterSpacing }= useAnimatedProperty<number>(eid, ref('letterSpacing'))
const { value: textAlign }    = useAnimatedProperty<string>(eid, ref('textAlign'))

const ALIGN_OPTIONS = [
  { value: 'left',    label: 'Left' },
  { value: 'center',  label: 'Center' },
  { value: 'right',   label: 'Right' },
  { value: 'justify', label: 'Justify' },
]

const WEIGHT_OPTIONS = [
  { value: '100', label: 'Thin' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
]

const fontWeightStr = computed({
  get: () => String(fontWeight.value),
  set: (v: string) => { fontWeight.value = Number(v) },
})
</script>

<template>
  <CollapsibleSection title="Text" :default-open="true">
    <Row>
      <Label>Size</Label>
      <NumberField v-model="fontSize" :min="1" :step="1" :precision="1" />
      <Label>Weight</Label>
      <Select v-model="fontWeightStr" :options="WEIGHT_OPTIONS" />
    </Row>
    <Row>
      <Label>Align</Label>
      <Select v-model="textAlign" :options="ALIGN_OPTIONS" />
    </Row>
    <Row>
      <Label>Leading</Label>
      <NumberField v-model="lineHeight" :min="0" :step="0.1" :precision="2" />
      <Label>Tracking</Label>
      <NumberField v-model="letterSpacing" :step="0.5" :precision="1" />
    </Row>
  </CollapsibleSection>
</template>
