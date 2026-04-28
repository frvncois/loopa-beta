import type { MediaRepository } from './MediaRepository'
import { supabase } from '@/core/supabase/client'

const BUCKET = 'media'

export class RemoteMediaRepo implements MediaRepository {
  private readonly userId: string
  private readonly projectId: string

  constructor(userId: string, projectId: string) {
    this.userId    = userId
    this.projectId = projectId
  }

  // Path scheme: {userId}/{projectId}/{storageId}
  private path(storageId: string): string {
    return `${this.userId}/${this.projectId}/${storageId}`
  }

  async put(id: string, blob: Blob): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(this.path(id), blob, { upsert: true })
    if (error) throw new Error(error.message)
  }

  async get(id: string): Promise<Blob | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(this.path(id))
    if (error) {
      if (error.message.includes('Object not found')) return null
      throw new Error(error.message)
    }
    return data
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove(ids.map((id) => this.path(id)))
    if (error) throw new Error(error.message)
  }
}
