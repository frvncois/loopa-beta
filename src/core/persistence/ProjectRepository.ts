import type { ProjectData, ProjectMeta } from '@/types/project'
import type { CloudProjectMeta, CloudProject, OwnershipTransfer } from '@/types/cloud'

export interface ProjectRepository {
  list(): Promise<ProjectMeta[]>
  load(id: string): Promise<ProjectData | null>
  save(id: string, data: ProjectData): Promise<void>
  delete(id: string): Promise<void>
}

export type UpdateResult =
  | { version: number }
  | { conflict: true; serverVersion: number }

export interface CloudProjectRepository {
  list(): Promise<CloudProjectMeta[]>
  listTrashed(): Promise<CloudProjectMeta[]>
  loadBySlug(slug: string): Promise<CloudProject | null>
  create(name: string, data: ProjectData): Promise<CloudProject>
  update(id: string, data: ProjectData, expectedVersion: number): Promise<UpdateResult>
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
  hardDelete(id: string): Promise<void>
  transferOwnership(id: string, toEmail: string): Promise<OwnershipTransfer>
}
