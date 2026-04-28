import { useDocumentStore } from '@/stores/useDocumentStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { renderProjectAtFrame } from '@/core/export/render/renderProjectAtFrame'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import { gatherImageData } from '@/core/export/imageData'
import { supabase } from '@/core/supabase/client'
import { dbUpdateThumbnail } from '@/core/supabase/queries'

const _mediaRepo = new IDBMediaRepo()

export function useThumbnail() {
  const doc = useDocumentStore()

  async function generateThumbnail(frameId: string): Promise<string | null> {
    const project = doc.serialize()
    const frame   = project.frames.find(f => f.id === frameId)
    if (!frame) return null

    const imageData = await gatherImageData(project, _mediaRepo)

    const rendered = renderProjectAtFrame(project, frameId, 0, { imageData })

    const W      = 240
    const H      = Math.round(frame.height * (W / frame.width))
    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return null

    const svgBlob = new Blob([rendered.svg], { type: 'image/svg+xml' })
    const url     = URL.createObjectURL(svgBlob)
    try {
      await new Promise<void>((resolve, reject) => {
        const img  = new Image()
        img.onload  = () => { ctx2d.drawImage(img, 0, 0, W, H); resolve() }
        img.onerror = () => reject(new Error('SVG rasterisation failed'))
        img.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }

    return canvas.toDataURL('image/png')
  }

  async function uploadThumbnail(projectId: string, dataUri: string): Promise<string | null> {
    const auth = useAuthStore()
    if (!auth.user) return null

    const res  = await fetch(dataUri)
    const blob = await res.blob()
    const path = `${auth.user.id}/${projectId}.png`

    const { error } = await supabase.storage
      .from('thumbnails')
      .upload(path, blob, { upsert: true, contentType: 'image/png' })
    if (error) {
      console.warn('Thumbnail upload failed:', error.message)
      return null
    }

    const { data } = supabase.storage.from('thumbnails').getPublicUrl(path)
    const url = data.publicUrl
    await dbUpdateThumbnail(projectId, url)
    return url
  }

  return { generateThumbnail, uploadThumbnail }
}
