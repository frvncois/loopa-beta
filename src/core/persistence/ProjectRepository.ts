import type { ProjectData, ProjectMeta } from '@/types/project'

export interface ProjectRepository {
  list(): Promise<ProjectMeta[]>
  load(id: string): Promise<ProjectData | null>
  save(id: string, data: ProjectData): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}
