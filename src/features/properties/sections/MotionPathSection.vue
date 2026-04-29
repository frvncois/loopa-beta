<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import CollapsibleSection from '@/ui/inspector/CollapsibleSection.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import Toggle from '@/ui/Toggle.vue'
import Button from '@/ui/Button.vue'

const props = defineProps<{ elementId: string }>()

const doc      = useDocumentStore()
const selection = useSelectionStore()
const history  = useHistoryStore()

const mp = computed(() => doc.motionPaths.find((m) => m.elementId === props.elementId) ?? null)

function setStartFrame(v: number): void {
  const motion = mp.value
  if (!motion) return
  history.transact('Motion path start frame', () => {
    doc.updateMotionPath(motion.id, { startFrame: Math.round(v) })
  })
}

function setEndFrame(v: number): void {
  const motion = mp.value
  if (!motion) return
  history.transact('Motion path end frame', () => {
    doc.updateMotionPath(motion.id, { endFrame: Math.round(v) })
  })
}

function setLoop(v: boolean): void {
  const motion = mp.value
  if (!motion) return
  history.transact('Motion path loop', () => {
    doc.updateMotionPath(motion.id, { loop: v })
  })
}

function setRotateAlongPath(v: boolean): void {
  const motion = mp.value
  if (!motion) return
  history.transact('Motion path rotate', () => {
    doc.updateMotionPath(motion.id, { rotateAlongPath: v })
  })
}

function editPath(): void {
  const motion = mp.value
  if (!motion) return
  selection.select(motion.pathElementId)
  selection.enterPathEditMode(motion.pathElementId)
}

function removeMotionPath(): void {
  const motion = mp.value
  if (!motion) return
  history.transact('Remove motion path', () => {
    doc.deleteElements([motion.pathElementId])
    selection.clearSelection()
  })
}
</script>

<template>
  <CollapsibleSection v-if="mp" title="Motion Path" :default-open="true">
    <Row>
      <Label>Start</Label>
      <NumberField :model-value="mp.startFrame" :min="0" :step="1" @update:model-value="setStartFrame" />
    </Row>
    <Row>
      <Label>End</Label>
      <NumberField :model-value="mp.endFrame" :min="0" :step="1" @update:model-value="setEndFrame" />
    </Row>
    <Row>
      <Label>Loop</Label>
      <Toggle :model-value="mp.loop" @update:model-value="setLoop" />
    </Row>
    <Row>
      <Label>Rotate</Label>
      <Toggle :model-value="mp.rotateAlongPath" @update:model-value="setRotateAlongPath" />
    </Row>
    <Row>
      <Button variant="default" size="sm" @click="editPath">Edit path</Button>
      <Button variant="danger" size="sm" class="ml-1.5" @click="removeMotionPath">Remove</Button>
    </Row>
  </CollapsibleSection>
</template>
