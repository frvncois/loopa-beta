import type { ImageElement } from '@/types/element'
import type { Track } from '@/types/track'
import type { LottieImageLayer, LottieAssetImage } from '../types'
import { buildTransform } from '../tracks'

export function buildImage(
  el: ImageElement,
  tracks: Track[],
  totalFrames: number,
  imageData: Record<string, string>,
  assets: LottieAssetImage[],
): LottieImageLayer {
  const assetId = `img_${el.id}`
  const dataUri = imageData[el.imageStorageId] ?? ''

  assets.push({
    id: assetId,
    w: el.imageWidth  || el.width,
    h: el.imageHeight || el.height,
    u: '',
    p: dataUri,
    e: 1,
  })

  return {
    ty: 2,
    refId: assetId,
    ind: 0,
    ip: 0, op: totalFrames, st: 0,
    nm: el.name || 'Image',
    sr: 1, ao: 0,
    ks: buildTransform(el, tracks, totalFrames),
  }
}
