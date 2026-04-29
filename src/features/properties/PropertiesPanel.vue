<script setup lang="ts">
import { computed } from 'vue'
import { usePrimarySelection } from '@/composables/usePrimarySelection'
import { useDocumentStore } from '@/stores/useDocumentStore'
import type { GroupElement } from '@/types/element'
import PositionSection from './sections/PositionSection.vue'
import TransformSection from './sections/TransformSection.vue'
import OpacitySection from './sections/OpacitySection.vue'
import FillSection from './sections/FillSection.vue'
import StrokeSection from './sections/StrokeSection.vue'
import ShadowSection from './sections/ShadowSection.vue'
import BlurSection from './sections/BlurSection.vue'
import TextSection from './sections/TextSection.vue'
import PathSection from './sections/PathSection.vue'
import MaskSection from './sections/MaskSection.vue'
import MotionPathSection from './sections/MotionPathSection.vue'
import ImageSection from './sections/ImageSection.vue'
import VideoSection from './sections/VideoSection.vue'
import ArtboardSettingsSection from './sections/ArtboardSettingsSection.vue'

const { elementId, element } = usePrimarySelection()
const doc = useDocumentStore()

const isMaskGroup = computed(() => {
  const el = element.value
  if (!el || el.type !== 'group') return false
  return (el as GroupElement).hasMask === true
})

const hasMotionPath = computed(() => {
  if (!element.value) return false
  const id = elementId.value
  return doc.motionPaths.some((mp) => mp.elementId === id)
})
</script>

<template>
  <div v-if="element" class="flex-1 flex flex-col min-h-0 overflow-y-auto">
    <MaskSection v-if="isMaskGroup" :element-id="elementId" />
    <MotionPathSection v-if="hasMotionPath" :element-id="elementId" />
    <PositionSection :element-id="elementId" />
    <TransformSection :element-id="elementId" />
    <OpacitySection :element-id="elementId" />
    <FillSection :element-id="elementId" />
    <StrokeSection :element-id="elementId" />
    <ShadowSection :element-id="elementId" />
    <BlurSection :element-id="elementId" />
    <PathSection v-if="element.type === 'path'" :element-id="elementId" />
    <TextSection v-if="element.type === 'text'" :element-id="elementId" />
    <ImageSection v-if="element.type === 'image'" :element-id="elementId" />
    <VideoSection v-if="element.type === 'video'" :element-id="elementId" />
  </div>
  <div v-else class="flex-1 flex flex-col min-h-0 overflow-y-auto">
    <ArtboardSettingsSection />
  </div>
</template>
