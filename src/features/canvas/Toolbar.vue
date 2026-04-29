<script setup lang="ts">
import { ref } from 'vue'
import { useToolStore } from '@/stores/useToolStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useAddMedia } from '@/composables/useAddMedia'
import IconButton from '@/ui/IconButton.vue'
import {
  IconSelect, IconHand, IconRect, IconEllipse, IconLine,
  IconPolygon, IconStar, IconText, IconPen, IconMotionPath,
  IconImage, IconVideo,
} from '@/ui/icons'
import type { ToolType } from '@/types/tool'

const tool      = useToolStore()
const selection = useSelectionStore()
const { addImageFile, addVideoFile } = useAddMedia()

const TOOLS: { id: ToolType; icon: unknown; shortcut: string; title: string }[] = [
  { id: 'select',      icon: IconSelect,     shortcut: 'V', title: 'Select (V)' },
  { id: 'hand',        icon: IconHand,       shortcut: 'H', title: 'Hand (H)' },
  { id: 'rect',        icon: IconRect,       shortcut: 'R', title: 'Rectangle (R)' },
  { id: 'ellipse',     icon: IconEllipse,    shortcut: 'E', title: 'Ellipse (E)' },
  { id: 'line',        icon: IconLine,       shortcut: 'L', title: 'Line (L)' },
  { id: 'polygon',     icon: IconPolygon,    shortcut: 'N', title: 'Polygon (N)' },
  { id: 'star',        icon: IconStar,       shortcut: 'S', title: 'Star (S)' },
  { id: 'text',        icon: IconText,       shortcut: 'T', title: 'Text (T)' },
  { id: 'pen',         icon: IconPen,        shortcut: 'P', title: 'Pen (P)' },
  { id: 'motion-path', icon: IconMotionPath, shortcut: 'M', title: 'Motion Path (M)' },
]

const imageInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)

function activeArtboardId(): string {
  return selection.activeArtboardId ?? ''
}

async function onImageFiles(e: Event): Promise<void> {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const artboardId = activeArtboardId()
  if (!artboardId) return
  for (const file of Array.from(files)) {
    await addImageFile(file, artboardId)
  }
  if (imageInputRef.value) imageInputRef.value.value = ''
}

async function onVideoFiles(e: Event): Promise<void> {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const artboardId = activeArtboardId()
  if (!artboardId) return
  for (const file of Array.from(files)) {
    await addVideoFile(file, artboardId)
  }
  if (videoInputRef.value) videoInputRef.value.value = ''
}
</script>

<template>
  <div class="flex flex-row items-center gap-0.5 px-1.5">
    <IconButton
      v-for="t in TOOLS"
      :key="t.id"
      size="sm"
      variant="ghost"
      :active="tool.currentTool === t.id"
      :title="t.title"
      @click="tool.setTool(t.id)"
    >
      <component :is="t.icon" />
    </IconButton>

    <div class="h-4 w-px bg-border mx-0.5" />

    <IconButton size="sm" variant="ghost" title="Add Image" @click="imageInputRef?.click()">
      <IconImage />
    </IconButton>
    <IconButton size="sm" variant="ghost" title="Add Video" @click="videoInputRef?.click()">
      <IconVideo />
    </IconButton>

    <input ref="imageInputRef" type="file" accept="image/*" multiple class="hidden" @change="onImageFiles" />
    <input ref="videoInputRef" type="file" accept="video/*" multiple class="hidden" @change="onVideoFiles" />
  </div>
</template>
