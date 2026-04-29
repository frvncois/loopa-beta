import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThumbnail } from './useThumbnail'
import { usePlanLimits } from './usePlanLimits'
import { RemoteProjectRepo } from '@/core/persistence/RemoteProjectRepo'
import { PlanLimitError } from '@/core/supabase/queries'
import type { ProjectData } from '@/types/project'

const PENDING_KEY = 'loopa.pendingPromotion'
const _repo       = new RemoteProjectRepo()
const _savedAt    = ref<number | null>(null)
const _serverConflictVersion = ref<number | null>(null)
let _debounce: ReturnType<typeof setTimeout> | null = null
let _isSaving   = false
let _watcherSet = false

export function useSaveOrchestrator() {
  const doc    = useDocumentStore()
  const auth   = useAuthStore()
  const router = useRouter()
  const limits = usePlanLimits()
  const { generateThumbnail, uploadThumbnail } = useThumbnail()

  function _cancelDebounce(): void {
    if (_debounce) { clearTimeout(_debounce); _debounce = null }
  }

  function _schedule(): void {
    _cancelDebounce()
    _debounce = setTimeout(() => void saveToCloud(), 2000)
  }

  async function saveToCloud(overrideVersion?: number): Promise<void> {
    if (_isSaving) return
    if (doc.saveStatus === 'conflict' && overrideVersion === undefined) return
    const id = doc.cloudProjectId
    if (!id) return
    _cancelDebounce()
    _isSaving = true
    doc.saveStatus = 'saving'

    try {
      const firstFrame = doc.frames[0]
      if (firstFrame) {
        try {
          const thumb = await generateThumbnail(firstFrame.id)
          if (thumb) {
            const publicUrl = await uploadThumbnail(id, thumb)
            doc.updateMeta({ thumbnail: publicUrl ?? thumb })
          }
        } catch { /* non-fatal */ }
      }

      const data             = doc.serialize()
      const expectedVersion  = overrideVersion ?? (doc.lastServerVersion ?? 1)
      const result           = await _repo.update(id, data, expectedVersion)

      if ('conflict' in result) {
        _serverConflictVersion.value = result.serverVersion
        doc.saveStatus = 'conflict'
      } else {
        doc.lastServerVersion = result.version
        doc.isDirty           = false
        doc.saveStatus        = 'saved'
        _savedAt.value        = Date.now()
        setTimeout(() => {
          if (doc.saveStatus === 'saved') doc.saveStatus = 'clean'
        }, 2000)
      }
    } catch {
      doc.saveStatus = 'error'
    } finally {
      _isSaving = false
    }
  }

  async function saveNow(): Promise<void> {
    if (doc.location === 'local') {
      if (auth.status !== 'authenticated') {
        // Anonymous: stash document and send to login
        localStorage.setItem(PENDING_KEY, JSON.stringify(doc.serialize()))
        await router.push('/login')
      } else {
        // Logged in at /app (no slug): promote directly to cloud
        doc.saveStatus = 'saving'
        try {
          const data   = doc.serialize()
          const result = await _repo.create(data.meta?.name ?? 'Untitled', data)
          await router.push(`/app/${result.meta.slug}`)
        } catch (err) {
          if (err instanceof PlanLimitError) {
            doc.saveStatus = 'clean'
            limits.showUpgradeModal('projects')
          } else {
            doc.saveStatus = 'error'
          }
        }
      }
      return
    }
    if (doc.location === 'cloud') {
      await saveToCloud()
    }
  }

  async function reloadFromServer(): Promise<void> {
    const s = doc.slug
    if (!s) return
    _cancelDebounce()
    _serverConflictVersion.value = null
    await doc.loadFromCloud(s)
  }

  async function overwriteServer(): Promise<void> {
    const v = _serverConflictVersion.value
    if (v === null) return
    _serverConflictVersion.value = null
    await saveToCloud(v)
  }

  async function promoteLocalToCloud(): Promise<string> {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) throw new Error('No pending promotion data')
    const data   = JSON.parse(raw) as ProjectData
    const result = await _repo.create(data.meta?.name ?? 'Untitled', data)
    localStorage.removeItem(PENDING_KEY)
    return result.meta.slug
  }

  function initCloudWatcher(): void {
    if (_watcherSet) return
    _watcherSet = true
    doc.$subscribe(() => {
      if (_isSaving || !doc.isDirty || doc.location !== 'cloud') return
      if (doc.saveStatus === 'conflict' || doc.saveStatus === 'error') return
      _schedule()
    })
  }

  return {
    savedAt:               _savedAt               as Readonly<typeof _savedAt>,
    serverConflictVersion: _serverConflictVersion  as Readonly<typeof _serverConflictVersion>,
    saveNow,
    saveToCloud,
    reloadFromServer,
    overwriteServer,
    promoteLocalToCloud,
    initCloudWatcher,
  }
}
