import type { CloudProjectRepository, UpdateResult } from './ProjectRepository'
import type { CloudProject, CloudProjectMeta, OwnershipTransfer } from '@/types/cloud'
import type { ProjectData } from '@/types/project'
import {
  dbListProjects,
  dbListTrashedProjects,
  dbLoadProjectBySlug,
  dbCreateProject,
  dbUpdateProject,
  dbSoftDeleteProject,
  dbRestoreProject,
  dbHardDeleteProject,
  dbRenameProject,
} from '@/core/supabase/queries'

export class RemoteProjectRepo implements CloudProjectRepository {
  async list(): Promise<CloudProjectMeta[]> {
    return dbListProjects()
  }

  async listTrashed(): Promise<CloudProjectMeta[]> {
    return dbListTrashedProjects()
  }

  async loadBySlug(slug: string): Promise<CloudProject | null> {
    return dbLoadProjectBySlug(slug)
  }

  async create(name: string, data: ProjectData): Promise<CloudProject> {
    return dbCreateProject(name, data)
  }

  async update(id: string, data: ProjectData, expectedVersion: number): Promise<UpdateResult> {
    return dbUpdateProject(id, data, expectedVersion)
  }

  async softDelete(id: string): Promise<void> {
    return dbSoftDeleteProject(id)
  }

  async restore(id: string): Promise<void> {
    return dbRestoreProject(id)
  }

  async hardDelete(id: string): Promise<void> {
    return dbHardDeleteProject(id)
  }

  async rename(id: string, name: string): Promise<void> {
    return dbRenameProject(id, name)
  }

  // Full implementation in Phase S9 (requires edge function for email→userId lookup)
  async transferOwnership(_id: string, _toEmail: string): Promise<OwnershipTransfer> {
    throw new Error('transferOwnership not yet implemented — see Phase S9')
  }
}
