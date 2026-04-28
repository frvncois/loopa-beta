<script setup lang="ts">
import { useAnimatedElement } from '@/composables/useAnimatedElement'
import type { GroupElement as GroupElementType, ImageElement, VideoElement } from '@/types/element'
import RectElement    from './RectElement.vue'
import EllipseElement from './EllipseElement.vue'
import LineElement    from './LineElement.vue'
import PolygonElement from './PolygonElement.vue'
import StarElement    from './StarElement.vue'
import TextElement    from './TextElement.vue'
import PathElement    from './PathElement.vue'
import GroupElement   from './GroupElement.vue'
import ImageShape     from './ImageShape.vue'
import VideoShape     from './VideoShape.vue'

const props = defineProps<{ elementId: string }>()

const animated = useAnimatedElement(() => props.elementId)
</script>

<template>
  <g v-if="animated" v-show="animated.visible">
    <RectElement    v-if="animated.type === 'rect'"     :element="animated" />
    <EllipseElement v-else-if="animated.type === 'ellipse'" :element="animated" />
    <LineElement    v-else-if="animated.type === 'line'"    :element="animated" />
    <PolygonElement v-else-if="animated.type === 'polygon'" :element="animated" />
    <StarElement    v-else-if="animated.type === 'star'"    :element="animated" />
    <TextElement    v-else-if="animated.type === 'text'"    :element="animated" />
    <PathElement    v-else-if="animated.type === 'path'"    :element="animated" />
    <GroupElement
      v-else-if="animated.type === 'group'"
      :element="(animated as GroupElementType)"
    />
    <ImageShape
      v-else-if="animated.type === 'image'"
      :element="(animated as ImageElement)"
    />
    <VideoShape
      v-else-if="animated.type === 'video'"
      :element="(animated as VideoElement)"
    />
  </g>
</template>
