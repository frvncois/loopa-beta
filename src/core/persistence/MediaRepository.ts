export interface MediaRepository {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | null>
  deleteMany(ids: string[]): Promise<void>
}
