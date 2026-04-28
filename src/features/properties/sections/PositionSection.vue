<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import { useElementOverrides } from '@/composables/useElementOverrides'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import { IconMotionPath } from '@/ui/icons'

const props = defineProps<{ elementId: string }>()
const eid = computed(() => props.elementId)

const { value: x } = useAnimatedProperty<number>(eid, ref('x'))
const { value: y } = useAnimatedProperty<number>(eid, ref('y'))
const { value: w } = useAnimatedProperty<number>(eid, ref('width'))
const { value: h } = useAnimatedProperty<number>(eid, ref('height'))

const overrides = useElementOverrides(eid)
</script>

<template>
  <CollapsibleSection title="Position" :default-open="true">
    <Row :title="overrides.x ? 'Driven by motion path' : undefined">
      <Label>X</Label>
      <IconMotionPath v-if="overrides.x" class="flex-shrink-0 w-3 h-3 text-text-3" />
      <NumberField v-model="x" :precision="1" :step="1" :disabled="overrides.x" />
    </Row>
    <Row :title="overrides.y ? 'Driven by motion path' : undefined">
      <Label>Y</Label>
      <IconMotionPath v-if="overrides.y" class="flex-shrink-0 w-3 h-3 text-text-3" />
      <NumberField v-model="y" :precision="1" :step="1" :disabled="overrides.y" />
    </Row>
    <Row>
      <Label>W</Label>
      <NumberField v-model="w" :min="1" :precision="1" :step="1" />
    </Row>
    <Row>
      <Label>H</Label>
      <NumberField v-model="h" :min="1" :precision="1" :step="1" />
    </Row>
  </CollapsibleSection>
</template>
