<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useClipboardStore } from '@/stores/useClipboardStore'
import type { GroupElement } from '@/types/element'
import ContextMenu from '@/ui/ContextMenu.vue'
import type { ContextMenuItem } from '@/ui/ContextMenu.vue'

const props = defineProps<{ show: boolean; x: number; y: number; artboardId: string }>()
const emit  = defineEmits<{ close: [] }>()

const doc       = useDocumentStore()
const selection = useSelectionStore()
const history   = useHistoryStore()
const clipboard = useClipboardStore()

const ids   = computed(() => [...selection.selectedIds])
const count = computed(() => ids.value.length)

const primaryEl = computed(() => (count.value === 1 ? doc.elementById(ids.value[0]!) : undefined))
const isGroup   = computed(() => primaryEl.value?.type === 'group')
const isMask    = computed(() => isGroup.value && (primaryEl.value as GroupElement).hasMask === true)

const items = computed((): ContextMenuItem[] => {
  if (count.value === 0) {
    return [
      { label: 'Paste', shortcut: '⌘V', disabled: !clipboard.hasPasteData, action: doPaste },
    ]
  }

  const base: ContextMenuItem[] = [
    { label: 'Cut',       shortcut: '⌘X', action: doCut },
    { label: 'Copy',      shortcut: '⌘C', action: doCopy },
    { label: 'Duplicate', shortcut: '⌘D', action: doDuplicate },
    { label: 'Delete',    shortcut: '⌫',  danger: true, action: doDelete },
    { separator: true, label: '' },
  ]

  if (count.value === 1) {
    const zOrder: ContextMenuItem[] = [
      { label: 'Bring to Front', action: () => doReorder('front') },
      { label: 'Send to Back',   action: () => doReorder('back') },
      { separator: true, label: '' },
    ]
    if (isMask.value) {
      return [...base, ...zOrder,
        { label: 'Ungroup',      shortcut: '⌘⇧G', action: doUngroup },
        { label: 'Release Mask', action: doReleaseMask },
      ]
    }
    if (isGroup.value) {
      return [...base, ...zOrder,
        { label: 'Ungroup',    shortcut: '⌘⇧G', action: doUngroup },
        { label: 'Use as Mask', action: doMask },
      ]
    }
    return [...base, ...zOrder,
      { label: 'Group', shortcut: '⌘G', disabled: true, action: () => {} },
    ]
  }

  // Multi-selection
  return [...base,
    { label: 'Group',       shortcut: '⌘G', action: doGroup },
    { label: 'Use as Mask', action: doMask },
  ]
})

function doCopy(): void { clipboard.copy(ids.value) }

function doCut(): void {
  const toDelete = [...ids.value]
  clipboard.copy(toDelete)
  history.transact('Cut', () => { doc.deleteElements(toDelete); selection.clearSelection() })
}

function doPaste(): void {
  if (!clipboard.hasPasteData) return
  history.transact('Paste', () => {
    const { elementIds } = clipboard.paste(props.artboardId)
    selection.selectMany(elementIds)
  })
}

function doDuplicate(): void {
  const todup = [...ids.value]
  history.transact('Duplicate', () => {
    const newIds = doc.duplicateElements(todup)
    selection.selectMany(newIds)
  })
}

function doDelete(): void {
  const toDelete = [...ids.value]
  history.transact('Delete', () => { doc.deleteElements(toDelete); selection.clearSelection() })
}

function doGroup(): void {
  const toGroup = [...ids.value]
  if (toGroup.length < 2) return
  history.transact('Group', () => {
    const groupId = doc.groupElements(toGroup)
    if (groupId) selection.select(groupId)
  })
}

function doUngroup(): void {
  const toUngroup = [...ids.value]
  history.transact('Ungroup', () => {
    const children: string[] = []
    for (const id of toUngroup) {
      const el = doc.elementById(id)
      if (el?.type === 'group') children.push(...doc.ungroupElements(id))
    }
    if (children.length > 0) selection.selectMany(children)
  })
}

function doMask(): void {
  const toMask = [...ids.value]
  if (toMask.length < 2) return
  history.transact('Use as Mask', () => {
    const groupId = doc.applyMask(toMask)
    if (groupId) selection.select(groupId)
  })
}

function doReleaseMask(): void {
  const id = ids.value[0]
  if (!id) return
  history.transact('Release Mask', () => {
    const el = doc.elementById(id)
    if (el?.type === 'group') {
      const children = doc.ungroupElements(id)
      selection.selectMany(children)
    }
  })
}

function doReorder(dir: 'front' | 'back'): void {
  const toReorder = [...ids.value]
  history.transact(dir === 'front' ? 'Bring to Front' : 'Send to Back', () => {
    for (const id of toReorder) {
      if (dir === 'front') doc.bringToFront(id)
      else doc.sendToBack(id)
    }
  })
}
</script>

<template>
  <ContextMenu :show="show" :x="x" :y="y" :items="items" @close="emit('close')" />
</template>
