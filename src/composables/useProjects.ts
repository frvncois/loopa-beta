import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RemoteProjectRepo } from '@/core/persistence/RemoteProjectRepo'
import { generateSlug } from '@/core/utils/slug'
import type { CloudProjectMeta } from '@/types/cloud'
import type { ProjectData } from '@/types/project'

const repo = new RemoteProjectRepo()

function emptyProjectData(name: string): ProjectData {
  const id      = generateSlug()
  const frameId = generateSlug()
  return {
    meta: { id, name, createdAt: Date.now(), updatedAt: Date.now(), thumbnail: null },
    frames: [{
      id: frameId, name: 'Frame 1',
      width: 800, height: 600, backgroundColor: '#0c0c0f',
      elementIds: [], order: 0,
      fps: 30, totalFrames: 60, loop: true, direction: 'normal',
      canvasX: 0, canvasY: 0,
    }],
    elements: [], tracks: [], motionPaths: [],
    schemaVersion: 3,
  }
}

export function useProjects() {
  const router   = useRouter()
  const projects = ref<CloudProjectMeta[]>([])
  const trashed  = ref<CloudProjectMeta[]>([])
  const loading  = ref(false)
  const error    = ref('')

  async function refresh() {
    loading.value = true
    error.value   = ''
    try {
      projects.value = await repo.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load projects'
    } finally {
      loading.value = false
    }
  }

  async function refreshTrashed() {
    loading.value = true
    error.value   = ''
    try {
      trashed.value = await repo.listTrashed()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load trash'
    } finally {
      loading.value = false
    }
  }

  async function create(name = 'Untitled') {
    const project = await repo.create(name, emptyProjectData(name))
    await router.push(`/app/${project.meta.slug}`)
  }

  async function rename(id: string, name: string) {
    await repo.rename(id, name)
    const p = projects.value.find((m) => m.id === id)
    if (p) p.name = name
  }

  async function duplicate(slug: string) {
    const source = await repo.loadBySlug(slug)
    if (!source) return
    await repo.create(`${source.meta.name} (copy)`, source.data)
    await refresh()
  }

  async function trash(id: string) {
    await repo.softDelete(id)
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  async function restore(id: string) {
    await repo.restore(id)
    trashed.value = trashed.value.filter((p) => p.id !== id)
  }

  async function hardDelete(id: string) {
    await repo.hardDelete(id)
    trashed.value = trashed.value.filter((p) => p.id !== id)
  }

  return {
    projects, trashed, loading, error,
    refresh, refreshTrashed, create, rename, duplicate, trash, restore, hardDelete,
  }
}
