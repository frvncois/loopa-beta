<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'

const props = defineProps<{ elementId: string }>()
const eid = computed(() => props.elementId)

const { value: blur } = useAnimatedProperty<number>(eid, ref('blur'))
</script>

<template>
  <CollapsibleSection title="Blur">
    <Row>
      <Label>Radius</Label>
      <NumberField v-model="blur" :min="0" :step="0.5" :precision="1" />
    </Row>
  </CollapsibleSection>
</template>
