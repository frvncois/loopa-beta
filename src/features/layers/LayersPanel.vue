<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useFrameActivation } from '@/composables/useFrameActivation'
import type { GroupElement } from '@/types/element'
import FrameRow from './FrameRow.vue'
import ElementRow from './ElementRow.vue'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const history   = useHistoryStore()
const { activateFrame } = useFrameActivation()

const frames = computed(() => [...doc.frames].sort((a, b) => a.order - b.order))

// Context menu state
const ctxMenu = ref<{ x: number; y: number; elementId: string } | null>(null)

const ctxElement = computed(() =>
  ctxMenu.value ? doc.elementById(ctxMenu.value.elementId) : null,
)
const ctxIsMaskGroup = computed(() => {
  const el = ctxElement.value
  return el?.type === 'group' && (el as GroupElement).hasMask === true
})
const canUseMask = computed(() => selection.selectedIds.size >= 2)

function topLevelElements(frameId: string) {
  return doc.topLevelElementsForFrame(frameId)
}

function onAddFrame(): void {
  const id = doc.addFrame()
  activateFrame(id)
}

function onSelect(id: string, multi: boolean): void {
  if (multi) selection.toggleSelection(id)
  else selection.select(id)
}

function onToggleVisibility(id: string): void {
  const el = doc.elementById(id)
  if (!el) return
  history.transact('Toggle visibility', () => {
    doc.updateElement(id, { visible: !el.visible })
  })
}

function onContextMenu(elementId: string, e: MouseEvent): void {
  ctxMenu.value = { x: e.clientX, y: e.clientY, elementId }
}

function closeCtxMenu(): void {
  ctxMenu.value = null
}

function onUseMask(): void {
  if (!canUseMask.value) return
  const ids = [...selection.selectedIds]
  history.transact('Use as Mask', () => {
    const groupId = doc.applyMask(ids)
    if (groupId) {
      selection.selectMany([groupId])
    }
  })
  ctxMenu.value = null
}

function onReleaseMask(): void {
  const id = ctxMenu.value?.elementId
  if (!id) return
  history.transact('Release Mask', () => {
    doc.ungroupElements(id)
    selection.clearSelection()
  })
  ctxMenu.value = null
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-y-auto" @click="closeCtxMenu">
    <!-- Add frame button row -->
    <div class="flex items-center justify-between px-3 h-[30px] border-b border-border flex-shrink-0">
      <span class="text-[10px] font-semibold text-text-4 uppercase tracking-wider">Layers</span>
      <button
        type="button"
        class="flex items-center gap-1 text-xs text-text-3 hover:text-text-1 transition-colors duration-[140ms]"
        title="Add Frame"
        @click="onAddFrame"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <span>Add Frame</span>
      </button>
    </div>

    <!-- One section per frame -->
    <template v-for="frame in frames" :key="frame.id">
      <FrameRow
        :frame-id="frame.id"
        :is-active="selection.activeFrameId === frame.id"
        @activate="activateFrame(frame.id)"
      />
      <ElementRow
        v-for="el in [...topLevelElements(frame.id)].reverse()"
        :key="el.id"
        :element="el"
        :depth="1"
        :is-selected="selection.selectedIds.has(el.id)"
        @select="onSelect(el.id, $event)"
        @toggle-visibility="onToggleVisibility(el.id)"
        @contextmenu="onContextMenu(el.id, $event)"
      />
    </template>

    <div v-if="frames.length === 0" class="flex-1 flex items-center justify-center">
      <span class="text-xs text-text-4 select-none">No frames</span>
    </div>
  </div>

  <!-- Floating context menu -->
  <Teleport to="body">
    <div
      v-if="ctxMenu"
      class="fixed z-[9000] bg-bg-3 border border-border-l rounded-md shadow-lg py-1 min-w-[160px]"
      :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }"
      @click.stop
    >
      <!-- Use as Mask — always visible, disabled if <2 selected -->
      <button
        type="button"
        :disabled="!canUseMask"
        :title="canUseMask ? 'Wrap selection in a mask group' : 'Select 2+ elements to create a mask'"
        class="w-full text-left px-3 py-1.5 text-xs transition-colors duration-[140ms]"
        :class="canUseMask
          ? 'text-text-2 hover:bg-bg-5 hover:text-text-1'
          : 'text-text-4 cursor-not-allowed'"
        @click="onUseMask"
      >
        Use as Mask
      </button>
      <!-- Release Mask — only for mask groups -->
      <button
        v-if="ctxIsMaskGroup"
        type="button"
        class="w-full text-left px-3 py-1.5 text-xs text-text-2 hover:bg-bg-5 hover:text-text-1 transition-colors duration-[140ms]"
        @click="onReleaseMask"
      >
        Release Mask
      </button>
    </div>
  </Teleport>
</template>
