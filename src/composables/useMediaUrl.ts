import { ref, watch, onUnmounted, toValue, type Ref, type ComputedRef } from 'vue'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'

const mediaRepo = new IDBMediaRepo()

// Module-level ref-counted blob URL cache
const cache = new Map<string, { url: string; refCount: number }>()

function release(id: string): void {
  if (!id) return
  const entry = cache.get(id)
  if (!entry) return
  entry.refCount--
  if (entry.refCount <= 0) {
    URL.revokeObjectURL(entry.url)
    cache.delete(id)
  }
}

export function useMediaUrl(storageId: Ref<string> | ComputedRef<string>) {
  const url = ref<string | null>(null)
  let activeId = ''

  async function load(id: string): Promise<void> {
    activeId = id
    if (!id) { url.value = null; return }

    // Cache hit — just increment ref count
    const cached = cache.get(id)
    if (cached) {
      cached.refCount++
      if (activeId === id) url.value = cached.url
      return
    }

    const blob = await mediaRepo.get(id)
    if (activeId !== id) return // stale — storageId changed while loading

    // Re-check after async gap (another load may have populated cache)
    const cached2 = cache.get(id)
    if (cached2) {
      cached2.refCount++
      url.value = cached2.url
      return
    }

    if (!blob) { url.value = null; return }

    const blobUrl = URL.createObjectURL(blob)
    cache.set(id, { url: blobUrl, refCount: 1 })
    url.value = blobUrl
  }

  watch(storageId, (newId, oldId) => {
    if (oldId) release(oldId)
    void load(newId)
  }, { immediate: true })

  onUnmounted(() => {
    release(toValue(storageId))
  })

  return { url: url as Readonly<typeof url> }
}
