import type { ProjectData } from '@/types/project'
import type { GifOptions, Mp4Options, PngSequenceOptions, WebmOptions } from '@/types/export'
import type { WorkerInput, WorkerOutput } from '@/workers/exportWorker'

export function useExportWorker() {
  let _worker: Worker | null = null

  function cancel(): void {
    _worker?.terminate()
    _worker = null
  }

  function runRasterExport(
    format:     'png-sequence' | 'gif' | 'mp4' | 'webm',
    project:    ProjectData,
    frameId:    string,
    options:    PngSequenceOptions | GifOptions | Mp4Options | WebmOptions,
    imageData:  Record<string, string>,
    onProgress: (current: number, total: number) => void,
  ): Promise<Blob> {
    cancel()  // terminate any previous export

    return new Promise<Blob>((resolve, reject) => {
      _worker = new Worker(
        new URL('../workers/exportWorker.ts', import.meta.url),
        { type: 'module' },
      )

      _worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
        const msg = e.data
        if (msg.type === 'progress') {
          onProgress(msg.current, msg.total)
        } else if (msg.type === 'done') {
          _worker?.terminate()
          _worker = null
          resolve(msg.blob)
        } else if (msg.type === 'error') {
          _worker?.terminate()
          _worker = null
          reject(new Error(msg.message))
        }
      }

      _worker.onerror = (ev: ErrorEvent) => {
        _worker?.terminate()
        _worker = null
        reject(new Error(ev.message ?? 'Worker error'))
      }

      // JSON round-trip strips Vue reactive Proxies — postMessage uses structured clone
      // which throws DataCloneError on Proxy objects from Pinia store state.
      const input: WorkerInput = JSON.parse(
        JSON.stringify({ format, project, frameId, options, imageData })
      )
      _worker.postMessage(input)
    })
  }

  return { runRasterExport, cancel }
}
