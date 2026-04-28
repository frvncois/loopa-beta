<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjects } from '@/composables/useProjects'
import { usePlanLimits } from '@/composables/usePlanLimits'
import ProjectCard from './ProjectCard.vue'
import EmptyDashboard from './EmptyDashboard.vue'
import Button from '@/ui/Button.vue'
import UpgradeModal from '@/features/upgrade/UpgradeModal.vue'

const { projects, loading, error, refresh, create, rename, duplicate, trash } = useProjects()
const limits   = usePlanLimits()
const search   = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? projects.value.filter((p) => p.name.toLowerCase().includes(q)) : projects.value
})

const isAtLimit = computed(() => limits.atProjectLimit(projects.value.length))

function handleCreate(): void {
  if (isAtLimit.value) {
    limits.showUpgradeModal('projects')
    return
  }
  void create()
}

onMounted(refresh)
</script>

<template>
  <div class="px-8 py-7 max-w-[1400px] mx-auto w-full">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <h1 class="text-text-1 text-sm font-semibold">Projects</h1>
      <div class="flex-1" />
      <input
        v-model="search"
        type="search"
        placeholder="Search\u2026"
        class="h-input w-48 bg-bg-3 border border-border rounded-sm px-[7px] text-xs text-text-1 font-sans outline-none transition-colors duration-[140ms] focus:border-accent placeholder:text-text-4"
      />
      <Button
        variant="accent"
        :disabled="isAtLimit"
        :title="isAtLimit ? 'Upgrade to Pro for unlimited projects' : undefined"
        @click="handleCreate"
      >
        New project
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <p class="text-text-4 text-xs">Loading\u2026</p>
    </div>

    <!-- Error -->
    <p v-else-if="error" class="text-danger text-xs py-4">{{ error }}</p>

    <!-- Empty state -->
    <EmptyDashboard
      v-else-if="projects.length === 0"
      :at-limit="isAtLimit"
      @create="handleCreate"
    />

    <!-- Search no results -->
    <p v-else-if="filtered.length === 0" class="text-text-4 text-xs py-8 text-center">
      No projects match "{{ search }}"
    </p>

    <!-- Grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      <ProjectCard
        v-for="project in filtered"
        :key="project.id"
        :project="project"
        @rename="(id, name) => rename(id, name)"
        @duplicate="(slug) => duplicate(slug)"
        @trash="(id) => trash(id)"
      />
    </div>

    <UpgradeModal />
  </div>
</template>
