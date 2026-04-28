<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import ColorField from '@/ui/ColorField.vue'
import NumberField from '@/ui/NumberField.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconMinus } from '@/ui/icons'

const props = defineProps<{ elementId: string; index: number }>()
const emit = defineEmits<{ remove: [] }>()

const eid        = computed(() => props.elementId)
const colorProp  = computed(() => `shadows.${props.index}.color`)
const xProp      = computed(() => `shadows.${props.index}.x`)
const yProp      = computed(() => `shadows.${props.index}.y`)
const blurProp   = computed(() => `shadows.${props.index}.blur`)
const spreadProp = computed(() => `shadows.${props.index}.spread`)

const { value: color  } = useAnimatedProperty<string>(eid, colorProp)
const { value: sx     } = useAnimatedProperty<number>(eid, xProp)
const { value: sy     } = useAnimatedProperty<number>(eid, yProp)
const { value: blur   } = useAnimatedProperty<number>(eid, blurProp)
const { value: spread } = useAnimatedProperty<number>(eid, spreadProp)
</script>

<template>
  <Row>
    <ColorField v-model="color" />
    <IconButton size="sm" variant="ghost" title="Remove shadow" @click="emit('remove')">
      <IconMinus />
    </IconButton>
  </Row>
  <Row>
    <Label>X / Y</Label>
    <NumberField v-model="sx" :step="1" :precision="1" />
    <NumberField v-model="sy" :step="1" :precision="1" />
  </Row>
  <Row>
    <Label>Blur</Label>
    <NumberField v-model="blur" :min="0" :step="1" :precision="1" />
    <Label>Spread</Label>
    <NumberField v-model="spread" :step="1" :precision="1" />
  </Row>
</template>
