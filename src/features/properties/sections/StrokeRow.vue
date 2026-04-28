<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import ColorField from '@/ui/ColorField.vue'
import NumberField from '@/ui/NumberField.vue'
import Select from '@/ui/Select.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconMinus } from '@/ui/icons'

const props = defineProps<{ elementId: string; index: number }>()
const emit = defineEmits<{ remove: [] }>()

const eid         = computed(() => props.elementId)
const colorProp   = computed(() => `strokes.${props.index}.color`)
const widthProp   = computed(() => `strokes.${props.index}.width`)
const posProp     = computed(() => `strokes.${props.index}.position`)

const { value: color }    = useAnimatedProperty<string>(eid, colorProp)
const { value: width }    = useAnimatedProperty<number>(eid, widthProp)
const { value: position } = useAnimatedProperty<string>(eid, posProp)

const POS_OPTIONS = [
  { value: 'center',  label: 'Center' },
  { value: 'inside',  label: 'Inside' },
  { value: 'outside', label: 'Outside' },
]
</script>

<template>
  <Row>
    <ColorField v-model="color" />
    <NumberField v-model="width" :min="0" :step="0.5" :precision="1" />
    <IconButton size="sm" variant="ghost" title="Remove stroke" @click="emit('remove')">
      <IconMinus />
    </IconButton>
  </Row>
  <Row>
    <Label>Align</Label>
    <Select v-model="position" :options="POS_OPTIONS" />
  </Row>
</template>
