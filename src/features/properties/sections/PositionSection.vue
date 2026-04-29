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

const { value: x, hasChangedFromInitial: xChanged, resetToInitial: xReset } = useAnimatedProperty<number>(eid, ref('x'))
const { value: y, hasChangedFromInitial: yChanged, resetToInitial: yReset } = useAnimatedProperty<number>(eid, ref('y'))
const { value: w, hasChangedFromInitial: wChanged, resetToInitial: wReset } = useAnimatedProperty<number>(eid, ref('width'))
const { value: h, hasChangedFromInitial: hChanged, resetToInitial: hReset } = useAnimatedProperty<number>(eid, ref('height'))

const overrides = useElementOverrides(eid)
</script>

<template>
  <CollapsibleSection title="Position" :default-open="true">
    <Row :title="overrides.x ? 'Driven by motion path' : undefined">
      <Label>X</Label>
      <IconMotionPath v-if="overrides.x" class="flex-shrink-0 w-3 h-3 text-text-3" />
      <NumberField v-model="x" :precision="1" :step="1" :disabled="overrides.x" />
      <button v-if="xChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="xReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row :title="overrides.y ? 'Driven by motion path' : undefined">
      <Label>Y</Label>
      <IconMotionPath v-if="overrides.y" class="flex-shrink-0 w-3 h-3 text-text-3" />
      <NumberField v-model="y" :precision="1" :step="1" :disabled="overrides.y" />
      <button v-if="yChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="yReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>W</Label>
      <NumberField v-model="w" :min="1" :precision="1" :step="1" />
      <button v-if="wChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="wReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
    <Row>
      <Label>H</Label>
      <NumberField v-model="h" :min="1" :precision="1" :step="1" />
      <button v-if="hChanged" class="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors" title="Reset to initial" @click="hReset()">
        <span class="w-1.5 h-1.5 rounded-full bg-accent block" />
      </button>
    </Row>
  </CollapsibleSection>
</template>
