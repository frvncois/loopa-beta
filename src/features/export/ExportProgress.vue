<script setup lang="ts">
import type { ExportJob } from '@/types/export'
import Button from '@/ui/Button.vue'

defineProps<{ job: ExportJob }>()
defineEmits<{ cancel: [] }>()
</script>

<template>
  <div class="flex flex-col gap-4 py-2">
    <p class="font-mono text-xs text-text-2">
      Exporting frame {{ job.currentFrame }} of {{ job.totalFrames }}
    </p>

    <!-- Progress bar -->
    <div class="w-full h-1.5 rounded-full bg-bg-3 overflow-hidden">
      <div
        class="h-full bg-accent rounded-full transition-all duration-100"
        :style="{ width: `${Math.round(job.progress * 100)}%` }"
      />
    </div>

    <p class="text-xs text-text-3 font-mono">{{ Math.round(job.progress * 100) }}%</p>

    <div class="flex justify-center">
      <Button variant="default" @click="$emit('cancel')">Cancel</Button>
    </div>
  </div>
</template>
