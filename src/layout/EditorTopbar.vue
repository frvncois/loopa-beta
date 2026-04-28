<script setup lang="ts">
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useAutosave } from '@/composables/useAutosave'
import { useEditorModals } from '@/composables/useEditorModals'
import IconButton from '@/ui/IconButton.vue'
import Divider from '@/ui/Divider.vue'
import { IconUndo, IconRedo, IconPlay, IconPause, IconStop, IconSettings } from '@/ui/icons'

const history  = useHistoryStore()
const timeline = useTimelineStore()
const doc      = useDocumentStore()
const autosave = useAutosave()
const modals   = useEditorModals()
</script>

<template>
  <header class="h-topbar flex-shrink-0 flex items-center px-3 gap-2 bg-bg-2 border-b border-border">
    <!-- Left: project name -->
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="flex-shrink-0 text-accent">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.15" />
        <path d="M5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" fill="currentColor" />
      </svg>
      <span class="text-xs font-semibold text-text-2 truncate select-none">
        {{ doc.meta?.name ?? 'Untitled' }}
      </span>
    </div>

    <!-- Center: save status -->
    <div class="flex-1 flex justify-center">
      <Transition
        enter-from-class="opacity-0"
        enter-active-class="transition-opacity duration-[140ms]"
        leave-to-class="opacity-0"
        leave-active-class="transition-opacity duration-[140ms]"
      >
        <span v-if="autosave.status.value !== 'idle'" class="text-[10px] text-text-4 select-none">
          {{ autosave.status.value === 'saving' ? 'Saving…' : 'Saved' }}
        </span>
      </Transition>
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

      <Divider :vertical="true" />

      <IconButton variant="ghost" size="sm" title="Stop" @click="timeline.stop()">
        <IconStop />
      </IconButton>
      <IconButton variant="ghost" size="sm" title="Play / Pause" @click="timeline.toggle()">
        <IconPause v-if="timeline.isPlaying" />
        <IconPlay v-else />
      </IconButton>

      <Divider :vertical="true" />

      <span class="text-xs font-mono text-text-3 tabular-nums w-[4.5rem] text-right select-none pr-1">
        {{ timeline.currentTime }}
      </span>

      <Divider :vertical="true" />

      <IconButton variant="ghost" size="sm" title="Project Settings (⌘,)" @click="modals.showSettings.value = true">
        <IconSettings />
      </IconButton>
    </div>
  </header>
</template>
