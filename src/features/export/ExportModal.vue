<script setup lang="ts">
import { computed } from 'vue'
import { useExport } from '@/composables/useExport'
import { useDocumentStore } from '@/stores/useDocumentStore'
import Modal from '@/ui/Modal.vue'
import Button from '@/ui/Button.vue'
import Select from '@/ui/Select.vue'
import ExportFormatPicker from './ExportFormatPicker.vue'
import ExportPreflight    from './ExportPreflight.vue'
import ExportProgress     from './ExportProgress.vue'
import type { ExportFormat, ExportOptions } from '@/types/export'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const {
  job,
  changeFormat,
  changeOptions,
  changeFrame,
  runExport,
  cancelExport,
  downloadResult,
  closeExport,
} = useExport()

const doc = useDocumentStore()

const frames = computed(() => [...doc.frames].sort((a, b) => a.order - b.order))
const frameOptions = computed(() =>
  frames.value.map((f) => ({ value: f.id, label: f.name || `Frame ${f.order + 1}` })),
)

const isExporting = computed(() => job.value?.status === 'exporting')
const isDone      = computed(() => job.value?.status === 'done')
const isError     = computed(() => job.value?.status === 'error')
const canExport   = computed(() => job.value?.preflight?.canExport ?? false)
</script>

<template>
  <Modal
    :show="show && job !== null"
    title="Export"
    width="560px"
    @close="closeExport"
  >
    <!-- Body -->
    <!-- Success -->
    <div v-if="isDone && job" class="flex flex-col items-center gap-4 py-6">
      <div class="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9l3.5 3.5L14 6" stroke="#4353ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="text-sm font-medium text-text-1">Export complete</p>
      <p class="text-xs text-text-3 font-mono">{{ job.resultFileName }}</p>
      <p class="text-xs text-text-4">{{ job.result ? (job.result.size / 1024).toFixed(1) + ' KB' : '' }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="isError && job" class="flex flex-col items-center gap-4 py-6">
      <div class="w-10 h-10 rounded-full bg-[rgb(239_68_68_/_0.10)] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 5v5M9 13h.01" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="text-sm font-medium text-text-1">Export failed</p>
      <p class="text-xs text-text-3 font-mono text-center max-w-[360px] break-words">{{ job.error }}</p>
    </div>

    <!-- Progress -->
    <ExportProgress v-else-if="isExporting && job" :job="job" @cancel="cancelExport" />

    <!-- Picker + preflight -->
    <div v-else-if="job" class="flex flex-col gap-0">
      <!-- Frame selector (only when >1 frame) -->
      <div v-if="frames.length > 1" class="flex items-center justify-between pb-4 border-b border-border mb-4">
        <span class="text-xs text-text-3">Frame</span>
        <div class="w-[180px]">
          <Select
            :model-value="job.frameId"
            :options="frameOptions"
            @update:model-value="changeFrame"
          />
        </div>
      </div>

      <!-- Format picker + options -->
      <div class="pb-4 border-b border-border">
        <ExportFormatPicker
          :format="job.format"
          :options="job.options"
          @update:format="(f: ExportFormat) => changeFormat(f)"
          @update:options="(o: ExportOptions) => changeOptions(o)"
        />
      </div>

      <!-- Preflight -->
      <div class="pt-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-text-4 mb-2">Preflight</p>
        <ExportPreflight :report="job.preflight" />
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <template v-if="isDone">
        <Button variant="default" @click="closeExport">Done</Button>
        <Button variant="accent" @click="downloadResult">Download</Button>
      </template>
      <template v-else-if="isError && job">
        <Button variant="default" @click="closeExport">Close</Button>
        <Button variant="accent" @click="changeFormat(job.format)">Try again</Button>
      </template>
      <template v-else-if="!isExporting && job">
        <Button variant="default" @click="closeExport">Cancel</Button>
        <Button variant="accent" :disabled="!canExport" @click="runExport">Export</Button>
      </template>
    </template>
  </Modal>
</template>
