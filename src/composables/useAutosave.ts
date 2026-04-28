import { ref } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useThumbnail } from './useThumbnail'
import { useSaveOrchestrator } from './useSaveOrchestrator'

type SaveStatus = 'idle' | 'saving' | 'saved'

// Module-level singletons (local-save state only)
const _status  = ref<SaveStatus>('idle')
const _savedAt = ref<number | null>(null)
let _debounce: ReturnType<typeof setTimeout> | null = null
let _isSaving  = false

export function useAutosave() {
  const doc          = useDocumentStore()
  const { generateThumbnail } = useThumbnail()
  const orchestrator = useSaveOrchestrator()

  async function doSave(): Promise<void> {
    // Cloud saves are handled entirely by useSaveOrchestrator
    if (doc.location === 'cloud') return
    if (_isSaving) return
    _isSaving     = true
    _status.value = 'saving'
    try {
      const firstFrame = doc.frames[0]
      if (firstFrame) {
        try {
          const thumb = await generateThumbnail(firstFrame.id)
          if (thumb) doc.updateMeta({ thumbnail: thumb })
        } catch { /* thumbnail failure is non-fatal */ }
      }
      await doc.saveProject()
      _status.value  = 'saved'
      _savedAt.value = Date.now()
      setTimeout(() => {
        if (_status.value === 'saved') _status.value = 'idle'
      }, 3000)
    } finally {
      _isSaving = false
    }
  }

  function schedule(): void {
    if (_debounce) clearTimeout(_debounce)
    _debounce = setTimeout(() => void doSave(), 2000)
  }

  function register(): void {
    orchestrator.initCloudWatcher()
    doc.$subscribe(() => {
      if (_isSaving || doc.location === 'cloud') return
      schedule()
    })
  }

  return {
    status:  _status  as Readonly<typeof _status>,
    savedAt: _savedAt as Readonly<typeof _savedAt>,
    register,
    save: doSave,
  }
}
