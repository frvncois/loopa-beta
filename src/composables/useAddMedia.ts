import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { usePlanLimits } from './usePlanLimits'
import { IDBMediaRepo } from '@/core/persistence/IDBMediaRepo'
import { createDefaultElement } from '@/core/elements/factory'
import { generateId } from '@/core/utils/id'
import type { ImageElement, VideoElement } from '@/types/element'

const MAX_DIM   = 800
const mediaRepo = new IDBMediaRepo()

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const u = URL.createObjectURL(blob)
    img.onload  = () => { URL.revokeObjectURL(u); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('Failed to read image')) }
    img.src = u
  })
}

function getVideoMeta(blob: Blob): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    const u = URL.createObjectURL(blob)
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration }) }
    v.onerror          = () => { URL.revokeObjectURL(u); reject(new Error('Failed to read video')) }
    v.src = u
    v.load()
  })
}

function scaledDims(naturalW: number, naturalH: number): { w: number; h: number } {
  const max = Math.max(naturalW, naturalH, 1)
  const scale = Math.min(1, MAX_DIM / max)
  return { w: Math.round(naturalW * scale), h: Math.round(naturalH * scale) }
}

export function useAddMedia() {
  const doc       = useDocumentStore()
  const selection = useSelectionStore()
  const history   = useHistoryStore()
  const limits    = usePlanLimits()

  async function addImageFile(
    file: File,
    frameId: string,
    dropX?: number,
    dropY?: number,
  ): Promise<void> {
    if (doc.location === 'cloud' && file.size > limits.storageRemaining.value) {
      limits.showUpgradeModal('storage')
      return
    }
    const storageId = generateId('media')
    await mediaRepo.put(storageId, file)

    const { width: natW, height: natH } = await getImageDimensions(file)
    const { w, h } = scaledDims(natW, natH)

    const frame = doc.frameById(frameId)
    const x = dropX ?? (frame ? frame.canvasX + (frame.width - w) / 2 : 0)
    const y = dropY ?? (frame ? frame.canvasY + (frame.height - h) / 2 : 0)

    const el: ImageElement = {
      ...createDefaultElement('image'),
      x, y, width: w, height: h,
      imageStorageId: storageId,
      imageFileName:  file.name,
      imageWidth:     natW,
      imageHeight:    natH,
      objectFit:      'contain',
    }

    history.transact('Add Image', () => {
      doc.addElement(el, frameId)
      selection.select(el.id)
    })
  }

  async function addVideoFile(
    file: File,
    frameId: string,
    dropX?: number,
    dropY?: number,
  ): Promise<void> {
    if (doc.location === 'cloud' && file.size > limits.storageRemaining.value) {
      limits.showUpgradeModal('storage')
      return
    }
    const storageId = generateId('media')
    await mediaRepo.put(storageId, file)

    const { width: natW, height: natH, duration } = await getVideoMeta(file)
    const { w, h } = scaledDims(natW || 640, natH || 360)

    const frame = doc.frameById(frameId)
    const x = dropX ?? (frame ? frame.canvasX + (frame.width - w) / 2 : 0)
    const y = dropY ?? (frame ? frame.canvasY + (frame.height - h) / 2 : 0)

    const el: VideoElement = {
      ...createDefaultElement('video'),
      x, y, width: w, height: h,
      videoStorageId: storageId,
      fileName:       file.name,
      duration:       duration || 0,
      naturalWidth:   natW,
      naturalHeight:  natH,
      trimStart:      0,
      trimEnd:        duration || 0,
      fit:            'cover',
      playbackRate:   1,
    }

    history.transact('Add Video', () => {
      doc.addElement(el, frameId)
      selection.select(el.id)
    })
  }

  return { addImageFile, addVideoFile, mediaRepo }
}
