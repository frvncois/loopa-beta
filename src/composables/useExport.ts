import { computed } from 'vue'
import { useExportStore } from '@/stores/useExportStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useEditorModals } from '@/composables/useEditorModals'
import { useExportWorker } from '@/composables/useExportWorker'
import { buildLottie, preflightLottie } from '@/core/export/lottie'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import { blobToDataUri, gatherImageData } from '@/core/export/imageData'
import type { ExportFormat, ExportOptions, PreflightReport, LottieOptions, PngSequenceOptions, GifOptions, Mp4Options, WebmOptions } from '@/types/export'
import type { ImageElement } from '@/types/element'

// ── Helpers ──────────────────────────────────────────────────────────────────

const _mediaRepo = new IDBMediaRepo()

function defaultOptions(format: ExportFormat): ExportOptions {
  switch (format) {
    case 'lottie':       return { format, prettyPrint: false }
    case 'png-sequence': return { format, scale: 1 }
    case 'gif':          return { format, scale: 1, quality: 'medium' }
    case 'mp4':          return { format, scale: 1, bitrate: 5000 }
    case 'webm':         return { format, scale: 1, bitrate: 4000 }
  }
}


// ── Module-level state ────────────────────────────────────────────────────────

let _cancelRequested = false
let _cancelWorker: (() => void) | null = null

// ── Composable ────────────────────────────────────────────────────────────────

export function useExport() {
  const store     = useExportStore()
  const doc       = useDocumentStore()
  const selection = useSelectionStore()
  const modals    = useEditorModals()

  const job = computed(() => store.currentJob)

  function _computePreflight(format: ExportFormat): PreflightReport {
    if (format === 'lottie' && store.currentJob) {
      const project = doc.serialize()
      const frame   = doc.artboardById(store.currentJob.artboardId)
      if (frame) return preflightLottie({ project, frame })
    }
    return { format, issues: [], canExport: true }
  }

  function _runPreflight(format: ExportFormat): void {
    store.setStatus('preflighting')
    store.setPreflight(_computePreflight(format))
    store.setStatus('ready')
  }

  function openExport(): void {
    const artboardId = selection.activeArtboardId ?? doc.artboards[0]?.id ?? ''
    const format: ExportFormat = 'lottie'
    store.startJob(format, defaultOptions(format), artboardId)
    _runPreflight(format)
    modals.showExport.value = true
  }

  function changeFormat(format: ExportFormat): void {
    if (!store.currentJob) return
    store.startJob(format, defaultOptions(format), store.currentJob.artboardId)
    _runPreflight(format)
  }

  function changeOptions(options: ExportOptions): void {
    if (!store.currentJob) return
    store.currentJob = { ...store.currentJob, options }
  }

  function changeArtboard(artboardId: string): void {
    if (!store.currentJob) return
    const { format, options } = store.currentJob
    store.startJob(format, options, artboardId)
    _runPreflight(store.currentJob.format)
  }

  async function runExport(): Promise<void> {
    if (!store.currentJob) return
    const job = store.currentJob
    const frame = doc.artboardById(job.artboardId)
    if (!frame) { store.setError('Artboard not found'); return }

    _cancelRequested = false
    store.setStatus('exporting')

    if (job.format === 'lottie') {
      try {
        const opts    = job.options as LottieOptions
        const project = doc.serialize()

        // Collect image data before passing to pure core function
        const imageData: Record<string, string> = {}
        const artboardIdSet = new Set(frame.elementIds)
        const imageEls = project.elements.filter(
          (el): el is ImageElement => el.type === 'image' && artboardIdSet.has(el.id),
        )
        for (const img of imageEls) {
          const blob = await _mediaRepo.get(img.imageStorageId)
          if (blob) imageData[img.imageStorageId] = await blobToDataUri(blob)
        }

        if (_cancelRequested) { store.cancel(); return }

        store.setProgress(0, 1)
        const json = buildLottie({ project, frame, imageData })
        const str  = opts.prettyPrint ? JSON.stringify(json, null, 2) : JSON.stringify(json)
        const blob = new Blob([str], { type: 'application/json' })
        const name = [
          project.meta.name.replace(/[^a-z0-9]/gi, '-'),
          frame.name.replace(/[^a-z0-9]/gi, '-'),
        ].join('-') + '.json'
        store.setProgress(1, 1)
        store.setResult(blob, name)
      } catch (err) {
        store.setError(err instanceof Error ? err.message : String(err))
      }
    } else {
      const opts    = job.options as PngSequenceOptions | GifOptions | Mp4Options | WebmOptions
      const project = doc.serialize()

      // Pre-resolve all image data before handing off to the worker
      const imageData = await gatherImageData(project, _mediaRepo)

      if (_cancelRequested) { store.cancel(); return }

      const { runRasterExport, cancel } = useExportWorker()
      _cancelWorker = cancel

      try {
        const blob = await runRasterExport(
          job.format,
          project,
          job.artboardId,
          opts,
          imageData,
          (current, total) => store.setProgress(current, total),
        )
        _cancelWorker = null
        const ext  = job.format === 'png-sequence' ? 'zip'
                   : job.format === 'gif'           ? 'gif'
                   : job.format === 'mp4'           ? 'mp4'
                   : 'webm'
        const name = [
          project.meta.name.replace(/[^a-z0-9]/gi, '-'),
          frame.name.replace(/[^a-z0-9]/gi, '-'),
        ].join('-') + '.' + ext
        store.setResult(blob, name)
      } catch (err) {
        _cancelWorker = null
        if (!_cancelRequested) store.setError(err instanceof Error ? err.message : String(err))
      }
    }
  }

  function cancelExport(): void {
    _cancelRequested = true
    _cancelWorker?.()
    _cancelWorker = null
    store.cancel()
  }

  function downloadResult(): void {
    const j = store.currentJob
    if (!j?.result || !j.resultFileName) return
    const url = URL.createObjectURL(j.result)
    const a   = document.createElement('a')
    a.href = url
    a.download = j.resultFileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function closeExport(): void {
    _cancelRequested = true
    store.reset()
    modals.showExport.value = false
  }

  return {
    job,
    openExport, changeFormat, changeOptions, changeArtboard,
    runExport, cancelExport, downloadResult, closeExport,
  }
}
