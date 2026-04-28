<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import EditorTopbar from './EditorTopbar.vue'
import ProjectSettingsModal from './ProjectSettingsModal.vue'
import ResizablePanel from '@/ui/ResizablePanel.vue'
import PanelHeader from '@/ui/PanelHeader.vue'
import ShortcutsModal from '@/ui/ShortcutsModal.vue'
import Toolbar from '@/features/canvas/Toolbar.vue'
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

const confirm  = useMotionPathConfirm()
const shortcuts = useShortcuts()
const autosave  = useAutosave()
const modals    = useEditorModals()

onMounted(() => {
  shortcuts.register()
  autosave.register()
})
onBeforeUnmount(() => shortcuts.unregister())
</script>

<template>
  <div class="h-full flex flex-col bg-bg-0 overflow-hidden">

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
          <PanelHeader title="Layers" />
          <LayersPanel />
        </div>
      </ResizablePanel>

      <!-- ── Center column: toolbar + canvas + timeline ─────────────── -->
      <div class="flex-1 flex flex-col min-w-0 min-h-0">

        <div class="flex flex-1 min-h-0 min-w-0">
          <Toolbar />
          <EditorCanvas />
        </div>

        <ResizablePanel
          side="bottom"
          :default-size="180"
          :min="120"
          :max="380"
          storage-key="loopa.panel.timeline"
          class="bg-bg-2 border-t border-border"
        >
          <div class="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
            <PanelHeader title="Timeline" />
            <TimelinePanel />
          </div>
        </ResizablePanel>

      </div>

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
</template>
