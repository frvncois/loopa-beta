<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'
import Row from '@/ui/inspector/Row.vue'
import ColorField from '@/ui/ColorField.vue'
import NumberField from '@/ui/NumberField.vue'
import IconButton from '@/ui/IconButton.vue'
import { IconMinus } from '@/ui/icons'

const props = defineProps<{ elementId: string; index: number }>()
const emit = defineEmits<{ remove: [] }>()

const eid       = computed(() => props.elementId)
const colorProp = computed(() => `fills.${props.index}.color`)
const opacProp  = computed(() => `fills.${props.index}.opacity`)

const { value: color } = useAnimatedProperty<string>(eid, colorProp)
const { value: opacityRaw } = useAnimatedProperty<number>(eid, opacProp)

const opacityPct = computed({
  get: () => Math.round((opacityRaw.value ?? 1) * 100),
  set: (v: number) => { opacityRaw.value = v / 100 },
})
</script>

<template>
  <Row>
    <ColorField v-model="color" />
    <NumberField v-model="opacityPct" :min="0" :max="100" :step="1" unit="%" />
    <IconButton size="sm" variant="ghost" title="Remove fill" @click="emit('remove')">
      <IconMinus />
    </IconButton>
  </Row>
</template>
