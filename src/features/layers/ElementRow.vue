<script setup lang="ts">
import type { Element, GroupElement } from '@/types/element'
import {
  IconRect, IconEllipse, IconLine, IconPolygon, IconStar,
  IconText, IconPen, IconGroup, IconImage, IconVideo,
} from '@/ui/icons'

const props = defineProps<{
  element: Element
  isSelected: boolean
  depth?: number
}>()

const emit = defineEmits<{
  select: [multi: boolean]
  'toggle-visibility': []
  'toggle-lock': []
  contextmenu: [e: MouseEvent]
}>()

const ICON_MAP: Record<string, unknown> = {
  rect: IconRect,
  ellipse: IconEllipse,
  line: IconLine,
  polygon: IconPolygon,
  star: IconStar,
  text: IconText,
  path: IconPen,
  group: IconGroup,
  image: IconImage,
  video: IconVideo,
}
</script>

<template>
  <div
    class="flex items-center gap-1 h-[26px] select-none cursor-pointer group transition-colors duration-[140ms] flex-shrink-0"
    :class="isSelected ? 'bg-accent-soft' : 'hover:bg-bg-3'"
    :style="{ paddingLeft: `${8 + (depth ?? 0) * 16}px`, paddingRight: '6px' }"
    @click.exact="emit('select', false)"
    @click.shift.exact="emit('select', true)"
    @contextmenu.prevent="emit('contextmenu', $event)"
  >
    <!-- Type icon -->
    <component
      :is="ICON_MAP[element.type]"
      class="flex-shrink-0 w-3 h-3 transition-colors duration-[140ms]"
      :class="isSelected ? 'text-accent' : 'text-text-3'"
    />
    <!-- Name -->
    <span
      class="flex-1 min-w-0 truncate text-xs transition-colors duration-[140ms]"
      :class="isSelected ? 'text-text-1' : 'text-text-2'"
    >{{ element.name }}</span>
    <!-- Mask badge -->
    <span
      v-if="element.type === 'group' && (element as GroupElement).hasMask"
      title="Mask group"
      class="flex-shrink-0 text-[9px] text-text-4 select-none leading-none"
    >mask</span>
    <!-- Visibility -->
    <button
      type="button"
      class="w-[18px] h-[18px] flex items-center justify-center rounded-[3px] transition-all duration-[140ms] opacity-0 group-hover:opacity-100"
      :class="[
        isSelected ? 'opacity-100' : '',
        !element.visible ? 'opacity-100 text-text-4' : 'text-text-3 hover:text-text-1',
      ]"
      :title="element.visible ? 'Hide' : 'Show'"
      @click.stop="emit('toggle-visibility')"
    >
      <svg v-if="element.visible" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 6C2.5 3 4 2 6 2s3.5 1 5 4c-1.5 3-3 4-5 4S2.5 9 1 6z" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="6" cy="6" r="1.5" stroke="currentColor" stroke-width="1.1"/>
      </svg>
      <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 2l8 8M5.5 3.1C5.67 3.03 5.84 3 6 3c2 0 3.5 1 5 4a9.8 9.8 0 0 1-1.6 2.3M3.2 4.2A9.8 9.8 0 0 0 1 6c1.5 3 3 4 5 4 .9 0 1.7-.3 2.5-.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>
