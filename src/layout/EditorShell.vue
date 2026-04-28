<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import EditorTopbar from './EditorTopbar.vue'
import ProjectSettingsModal from './ProjectSettingsModal.vue'
import ExportModal from '@/features/export/ExportModal.vue'
import ResizablePanel from '@/ui/ResizablePanel.vue'
import PanelHeader from '@/ui/PanelHeader.vue'
import ShortcutsModal from '@/ui/ShortcutsModal.vue'
import EditorCanvas from '@/features/canvas/EditorCanvas.vue'
import LayersPanel from '@/features/layers/LayersPanel.vue'
import PropertiesPanel from '@/features/properties/PropertiesPanel.vue'
import TimelinePanel from '@/features/timeline/TimelinePanel.vue'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'
import { useMotionPathConfirm } from '@/composables/useMotionPathConfirm'
import { useShortcuts } from '@/composables/useShortcuts'
import { useAutosave } from '@/composables/useAutosave'
import { useEditorModals } from '@/composables/useEditorModals'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useFrameActivation } from '@/composables/useFrameActivation'

const confirm  = useMotionPathConfirm()
const shortcuts = useShortcuts()
const autosave  = useAutosave()
const modals    = useEditorModals()
const doc       = useDocumentStore()
const { activateFrame } = useFrameActivation()

function onAddFrame(): void {
  const id = doc.addFrame()
  activateFrame(id)
}

onMounted(() => {
  shortcuts.register()
  autosave.register()
})
onBeforeUnmount(() => shortcuts.unregister())
</script>

<template>
  <div class="h-dvh flex flex-col bg-bg-0 overflow-hidden">

    <EditorTopbar />

    <div class="flex flex-1 min-h-0">

      <!-- ── Left panel: Layers ──────────────────────────────────────── -->
      <ResizablePanel
        side="left"
        :default-size="232"
        :min="180"
        :max="340"
        storage-key="loopa.panel.left"
        class="bg-bg-2 border-r border-border"
      >
        <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden h-full">
          <PanelHeader title="Layers">
            <template #actions>
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
            </template>
          </PanelHeader>
          <LayersPanel />
        </div>
      </ResizablePanel>

      <!-- ── Center column: canvas ──────────────────────────────────── -->
      <EditorCanvas />

      <!-- ── Right panel: Properties ────────────────────────────────── -->
      <ResizablePanel
        side="right"
        :default-size="256"
        :min="220"
        :max="380"
        storage-key="loopa.panel.right"
        class="bg-bg-2 border-l border-border"
      >
        <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden h-full">
          <PanelHeader title="Properties" />
          <PropertiesPanel />
        </div>
      </ResizablePanel>

    </div>

    <!-- ── Timeline: full width ───────────────────────────────────── -->
    <ResizablePanel
      side="bottom"
      :default-size="180"
      :min="120"
      :max="380"
      storage-key="loopa.panel.timeline"
      class="bg-bg-2 border-t border-border"
    >
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
        <TimelinePanel />
      </div>
    </ResizablePanel>

  </div>

  <!-- Motion path confirmation modal -->
  <Modal
    :show="confirm.isOpen.value"
    title="Override position keyframes?"
    @close="confirm.cancel()"
  >
    <p class="text-sm text-text-2 leading-relaxed">
      This element has position keyframes. The motion path will override them while active.
      Existing keyframes are preserved and resume control if the motion path is removed.
    </p>
    <template #footer>
      <Button variant="default" @click="confirm.cancel()">Cancel</Button>
      <Button variant="accent" @click="confirm.confirm()">Add motion path</Button>
    </template>
  </Modal>

  <!-- Keyboard shortcuts reference -->
  <ShortcutsModal :show="modals.showShortcuts.value" @close="modals.showShortcuts.value = false" />

  <!-- Project settings -->
  <ProjectSettingsModal :show="modals.showSettings.value" @close="modals.showSettings.value = false" />

  <!-- Export -->
  <ExportModal :show="modals.showExport.value" @close="modals.showExport.value = false" />
</template>
