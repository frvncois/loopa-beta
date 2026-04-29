<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useArtboardActivation } from '@/composables/useArtboardActivation'
import { useEditorModals } from '@/composables/useEditorModals'
import type { GroupElement } from '@/types/element'
import ArtboardRow from './ArtboardRow.vue'
import ElementRow from './ElementRow.vue'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const history   = useHistoryStore()
const { activateArtboard } = useArtboardActivation()
const modals    = useEditorModals()

const artboards = computed(() => [...doc.artboards].sort((a, b) => a.order - b.order))

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

function topLevelElements(artboardId: string) {
  return doc.topLevelElementsForArtboard(artboardId)
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
  <div class="flex-1 flex flex-col min-h-0" @click="closeCtxMenu">
  <div class="flex-1 overflow-y-auto min-h-0">
    <!-- One section per artboard -->
    <template v-for="artboard in artboards" :key="artboard.id">
      <ArtboardRow
        :artboard-id="artboard.id"
        :is-active="selection.activeArtboardId === artboard.id"
        @activate="activateArtboard(artboard.id)"
      />
      <ElementRow
        v-for="el in [...topLevelElements(artboard.id)].reverse()"
        :key="el.id"
        :element="el"
        :depth="1"
        :is-selected="selection.selectedIds.has(el.id)"
        @select="onSelect(el.id, $event)"
        @toggle-visibility="onToggleVisibility(el.id)"
        @contextmenu="onContextMenu(el.id, $event)"
      />
    </template>

    <div v-if="artboards.length === 0" class="flex-1 flex items-center justify-center">
      <span class="text-xs text-text-4 select-none">No artboards</span>
    </div>
  </div>

  <!-- Shortcuts CTA -->
  <button
    type="button"
    class="flex items-center justify-between w-full px-3 h-[30px] min-h-[30px] border-t border-border
           text-[10px] text-text-4 hover:text-text-2 hover:bg-bg-3 transition-colors duration-[140ms] select-none flex-shrink-0"
    @click.stop="modals.showShortcuts.value = true"
  >
    <span>Keyboard shortcuts</span>
    <kbd class="font-mono text-[9px] text-text-4 bg-bg-4 border border-border rounded px-1 py-px">?</kbd>
  </button>

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
