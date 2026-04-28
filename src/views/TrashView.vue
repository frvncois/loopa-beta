<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjects } from '@/composables/useProjects'
import AppShell from '@/layout/AppShell.vue'
import Button from '@/ui/Button.vue'

const { trashed, loading, error, refreshTrashed, restore, hardDelete } = useProjects()

onMounted(refreshTrashed)

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <AppShell>
    <div class="px-8 py-7 max-w-[1400px] mx-auto w-full">

      <div class="flex items-center gap-3 mb-6">
        <RouterLink to="/dashboard" class="text-text-4 text-xs hover:text-text-2 transition-colors duration-[140ms]">
          ← Projects
        </RouterLink>
        <h1 class="text-text-1 text-sm font-semibold">Trash</h1>
      </div>

      <p v-if="loading" class="text-text-4 text-xs py-8">Loading…</p>
      <p v-else-if="error" class="text-danger text-xs py-4">{{ error }}</p>

      <div v-else-if="trashed.length === 0" class="flex flex-col items-center py-24 text-center">
        <p class="text-text-2 text-sm font-medium mb-1">Trash is empty</p>
        <p class="text-text-4 text-xs">Projects moved to trash are deleted after 30 days.</p>
      </div>

      <div v-else class="flex flex-col gap-1">
        <p class="text-text-4 text-xs mb-3">Projects in trash are permanently deleted after 30 days.</p>
        <div
          v-for="project in trashed"
          :key="project.id"
          class="flex items-center gap-3 h-10 px-3 rounded-md hover:bg-bg-2 transition-colors duration-[140ms] group"
        >
          <span class="flex-1 text-xs text-text-2 truncate">{{ project.name }}</span>
          <span class="text-[10px] text-text-4 flex-shrink-0">
            Trashed {{ formatDate(project.trashedAt ?? project.updatedAt) }}
          </span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[140ms]">
            <Button size="xs" @click="restore(project.id)">Restore</Button>
            <Button size="xs" variant="danger" @click="hardDelete(project.id)">Delete permanently</Button>
          </div>
        </div>
      </div>

    </div>
  </AppShell>
</template>
