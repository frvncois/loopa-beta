<script setup lang="ts">
import { TEMPLATES } from '@/core/templates/index'
import TemplateTile from './TemplateTile.vue'
import Button from '@/ui/Button.vue'

defineProps<{ atLimit?: boolean }>()
defineEmits<{ create: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 px-4 text-center">
    <div class="w-10 h-10 rounded-lg bg-bg-3 border border-border flex items-center justify-center mb-4">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" class="text-text-4">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.2"/>
        <path d="M9 6v6M6 9h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>
    <p class="text-text-2 text-sm font-medium mb-1">No projects yet</p>
    <p class="text-text-4 text-xs mb-5">Create your first animation to get started.</p>
    <span
      v-if="atLimit"
      class="inline-flex items-center gap-1.5 h-input px-3 bg-bg-3 text-text-4 text-xs font-medium rounded-sm border border-border cursor-not-allowed"
      title="Upgrade to Pro for unlimited projects"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1v8M1 5h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      New project
    </span>
    <Button v-else variant="accent" @click="$emit('create')">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1v8M1 5h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      New project
    </Button>

    <!-- Template row -->
    <div class="mt-8 w-full max-w-sm">
      <p class="text-[11px] text-text-4 font-medium mb-3 text-left">Start from a template</p>
      <div class="grid grid-cols-2 gap-3">
        <TemplateTile
          v-for="tpl in TEMPLATES"
          :key="tpl.name"
          :template="tpl"
        />
      </div>
    </div>
  </div>
</template>
