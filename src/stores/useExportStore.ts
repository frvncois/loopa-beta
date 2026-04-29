import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import type { ExportJob, ExportFormat, ExportOptions, ExportJobStatus, PreflightReport } from '@/types/export'
import { generateId } from '@/core/utils/id'

export const useExportStore = defineStore('export', () => {
  const currentJob = ref<ExportJob | null>(null)

  function startJob(format: ExportFormat, options: ExportOptions, artboardId: string): void {
    currentJob.value = {
      id: generateId(),
      format,
      options,
      artboardId,
      status: 'idle',
      preflight: null,
      progress: 0,
      currentFrame: 0,
      totalFrames: 0,
      error: null,
      result: null,
      resultFileName: null,
    }
  }

  function setPreflight(report: PreflightReport): void {
    if (!currentJob.value) return
    currentJob.value = { ...currentJob.value, preflight: report }
  }

  function setStatus(status: ExportJobStatus): void {
    if (!currentJob.value) return
    currentJob.value = { ...currentJob.value, status }
  }

  function setProgress(currentFrame: number, totalFrames: number): void {
    if (!currentJob.value) return
    currentJob.value = {
      ...currentJob.value,
      currentFrame,
      totalFrames,
      progress: totalFrames > 0 ? currentFrame / totalFrames : 0,
    }
  }

  function setResult(blob: Blob, fileName: string): void {
    if (!currentJob.value) return
    currentJob.value = {
      ...currentJob.value,
      status: 'done',
      result: blob,
      resultFileName: fileName,
    }
  }

  function setError(msg: string): void {
    if (!currentJob.value) return
    currentJob.value = { ...currentJob.value, status: 'error', error: msg }
  }

  function cancel(): void {
    if (!currentJob.value) return
    currentJob.value = { ...currentJob.value, status: 'cancelled' }
  }

  function reset(): void {
    currentJob.value = null
  }

  return {
    currentJob,
    startJob,
    setPreflight,
    setStatus,
    setProgress,
    setResult,
    setError,
    cancel,
    reset,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useExportStore, import.meta.hot))
