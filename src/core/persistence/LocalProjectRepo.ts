import type { ProjectRepository } from './ProjectRepository'
import type { ProjectData, ProjectMeta } from '@/types/project'

const INDEX_KEY = 'loopa.v2.projects.index'
const projectKey = (id: string) => `loopa.v2.project.${id}`

export class LocalProjectRepo implements ProjectRepository {
  async list(): Promise<ProjectMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as ProjectMeta[]) : []
    } catch {
      return []
    }
  }

  async load(id: string): Promise<ProjectData | null> {
    const raw = localStorage.getItem(projectKey(id))
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      return parsed != null && typeof parsed === 'object' ? (parsed as ProjectData) : null
    } catch {
      return null
    }
  }

  async save(id: string, data: ProjectData): Promise<void> {
    localStorage.setItem(projectKey(id), JSON.stringify(data))
    const index = await this.list()
    const existingIdx = index.findIndex((m) => m.id === id)
    if (existingIdx >= 0) {
      index[existingIdx] = data.meta
    } else {
      index.push(data.meta)
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  async delete(id: string): Promise<void> {
    localStorage.removeItem(projectKey(id))
    const index = await this.list()
    localStorage.setItem(INDEX_KEY, JSON.stringify(index.filter((m) => m.id !== id)))
  }

}
