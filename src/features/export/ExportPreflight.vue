<script setup lang="ts">
import { computed } from 'vue'
import type { PreflightReport, PreflightIssue, PreflightSeverity } from '@/types/export'

const props = defineProps<{ report: PreflightReport | null }>()

const issues = computed<PreflightIssue[]>(() => {
  if (!props.report) return []
  return [...props.report.issues].sort((a, b) => {
    const order: Record<PreflightSeverity, number> = { error: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
})

const dotClass: Record<PreflightSeverity, string> = {
  error:   'bg-danger',
  warning: 'bg-warning',
  info:    'bg-text-3',
}

const textClass: Record<PreflightSeverity, string> = {
  error:   'text-danger',
  warning: 'text-warning',
  info:    'text-text-2',
}
</script>

<template>
  <div>
    <div v-if="issues.length === 0" class="text-xs text-text-3 px-3 py-4 text-center">
      No issues. Ready to export.
    </div>
    <div v-else>
      <div
        v-for="issue in issues"
        :key="issue.code + (issue.elementId ?? '')"
        class="px-3 py-2 flex items-start gap-2 border-b border-border last:border-0"
      >
        <span
          class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]"
          :class="dotClass[issue.severity]"
        />
        <span class="text-xs leading-relaxed" :class="textClass[issue.severity]">
          {{ issue.message }}
          <span v-if="issue.elementName" class="text-text-3"> · {{ issue.elementName }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
