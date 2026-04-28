import { useDocumentStore } from '@/stores/useDocumentStore'
import { renderProjectAtFrame } from '@/core/export/render/renderProjectAtFrame'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import { gatherImageData } from '@/core/export/imageData'

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

  return { generateThumbnail }
}
