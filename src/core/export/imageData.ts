import type { ProjectData } from '@/types/project'
import type { ImageElement } from '@/types/element'
import type { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'

export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Resolve all image elements in a project to data URIs via the media repo. */
export async function gatherImageData(
  project:   ProjectData,
  mediaRepo: IDBMediaRepo,
): Promise<Record<string, string>> {
  const imageData: Record<string, string> = {}
  for (const el of project.elements) {
    if (el.type === 'image') {
      const img  = el as ImageElement
      const blob = await mediaRepo.get(img.imageStorageId)
      if (blob) imageData[img.imageStorageId] = await blobToDataUri(blob)
    }
  }
  return imageData
}
