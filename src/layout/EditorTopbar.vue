<script setup lang="ts">
import { ref } from 'vue'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useEditorModals } from '@/composables/useEditorModals'
import { useExport } from '@/composables/useExport'
import IconButton from '@/ui/IconButton.vue'
import Button from '@/ui/Button.vue'
import Divider from '@/ui/Divider.vue'
import Toolbar from '@/features/canvas/Toolbar.vue'
import SaveButton from '@/features/editor/SaveButton.vue'
import SaveStatusIndicator from '@/features/editor/SaveStatusIndicator.vue'
import SaveModal from '@/features/auth/SaveModal.vue'
import { IconUndo, IconRedo, IconSettings, IconHome } from '@/ui/icons'

const history        = useHistoryStore()
const doc            = useDocumentStore()
const auth           = useAuthStore()
const modals         = useEditorModals()
const { openExport } = useExport()

const showSaveModal = ref(false)
</script>

<template>
  <header class="h-topbar flex-shrink-0 flex items-center px-3 gap-2 bg-bg-2 border-b border-border">
    <!-- Left: project name + save state -->
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <IconButton variant="ghost" size="sm" title="Dashboard" @click="$router.push('/dashboard')">
        <IconHome />
      </IconButton>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 text-accent">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.15" />
        <path d="M5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" fill="currentColor" />
      </svg>
      <span class="text-xs font-semibold text-text-2 truncate select-none">
        {{ doc.meta?.name ?? 'Untitled' }}
      </span>
      <SaveStatusIndicator />
      <SaveButton />
    </div>

    <!-- Center: toolbar -->
    <div class="flex-1 flex justify-center">
      <Toolbar />
    </div>

    <!-- Right: controls -->
    <div class="flex items-center gap-0.5 flex-1 justify-end">
      <IconButton
        variant="ghost"
        size="sm"
        :disabled="!history.canUndo"
        title="Undo (⌘Z)"
        @click="history.undo()"
      >
        <IconUndo />
      </IconButton>
      <IconButton
        variant="ghost"
        size="sm"
        :disabled="!history.canRedo"
        title="Redo (⌘⇧Z)"
        @click="history.redo()"
      >
        <IconRedo />
      </IconButton>

      <Button
        v-if="auth.status === 'anonymous'"
        variant="default"
        size="sm"
        @click="showSaveModal = true"
      >
        Save
      </Button>
      <Button variant="accent" size="sm" @click="openExport">Export</Button>

      <Divider :vertical="true" />

      <IconButton variant="ghost" size="sm" title="Project Settings (⌘,)" @click="modals.showSettings.value = true">
        <IconSettings />
      </IconButton>
    </div>
  </header>

  <SaveModal :show="showSaveModal" @close="showSaveModal = false" />
</template>
