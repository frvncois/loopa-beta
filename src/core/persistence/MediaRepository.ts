export interface MediaRepository {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | null>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}
