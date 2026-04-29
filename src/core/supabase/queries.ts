// Typed Supabase query helpers — all PostgREST/RPC calls live here.
// Repositories import from this file; stores and components do not.

import { supabase } from './client'
import type { Json } from './types'
import type { CloudProjectMeta, CloudProject } from '@/types/cloud'
import type { ProjectData } from '@/types/project'
import type { UpdateResult } from '@/core/persistence/ProjectRepository'

// ── Errors ───────────────────────────────────────────────────────────────────

export class PlanLimitError extends Error {
  readonly name = 'PlanLimitError'
  constructor(detail: string) {
    super(detail.replace(/^plan_limit:\s*/i, ''))
  }
}

// ── Row mappers ───────────────────────────────────────────────────────────────

type ProjectRow = {
  id: string; slug: string; owner_id: string; name: string
  thumbnail_url: string | null; version: number; storage_used_bytes: number
  trashed_at: string | null; created_at: string; updated_at: string; data: Json
}

function rowToMeta(row: ProjectRow): CloudProjectMeta {
  return {
    id:               row.id,
    slug:             row.slug,
    ownerId:          row.owner_id,
    name:             row.name,
    thumbnailUrl:     row.thumbnail_url,
    version:          row.version,
    storageUsedBytes: row.storage_used_bytes,
    trashedAt:        row.trashed_at ? new Date(row.trashed_at).getTime() : null,
    createdAt:        new Date(row.created_at).getTime(),
    updatedAt:        new Date(row.updated_at).getTime(),
  }
}

// ── Project queries ───────────────────────────────────────────────────────────

export async function dbListProjects(): Promise<CloudProjectMeta[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .is('trashed_at', null)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToMeta)
}

export async function dbListTrashedProjects(): Promise<CloudProjectMeta[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .not('trashed_at', 'is', null)
    .order('trashed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToMeta)
}

export async function dbLoadProjectBySlug(slug: string): Promise<CloudProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  if (!data) return null
  return { meta: rowToMeta(data), data: data.data as unknown as ProjectData }
}

export async function dbCreateProject(name: string, data: ProjectData): Promise<CloudProject> {
  const { data: row, error } = await supabase.rpc('create_project', {
    name,
    data: data as unknown as Json,
  })
  if (error) {
    if (error.message.startsWith('plan_limit:')) throw new PlanLimitError(error.message)
    throw new Error(error.message)
  }
  if (row == null || typeof row !== 'object' || !('slug' in row))
    throw new Error('create_project returned unexpected value — apply migration 0003 in Supabase')
  return { meta: rowToMeta(row as unknown as ProjectRow), data }
}

export async function dbUpdateProject(
  projectId: string,
  data: ProjectData,
  expectedVersion: number,
): Promise<UpdateResult> {
  const { data: newVersion, error } = await supabase.rpc('update_project', {
    project_id: projectId,
    data: data as unknown as Json,
    expected_version: expectedVersion,
  })
  if (error) {
    if (error.message.startsWith('conflict:')) {
      const [, versionStr] = /current (\d+)/.exec(error.message) ?? []
      return { conflict: true, serverVersion: versionStr != null ? parseInt(versionStr, 10) : expectedVersion + 1 }
    }
    if (error.message.startsWith('plan_limit:')) throw new PlanLimitError(error.message)
    throw new Error(error.message)
  }
  return { version: newVersion as number }
}

export async function dbSoftDeleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ trashed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function dbRestoreProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ trashed_at: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function dbHardDeleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function dbCheckMediaQuota(projectId: string, sizeBytes: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_media_quota', {
    project_id: projectId,
    size_bytes: sizeBytes,
  })
  if (error) throw new Error(error.message)
  return data as boolean
}

export async function dbRenameProject(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function dbUpdateThumbnail(id: string, thumbnailUrl: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
