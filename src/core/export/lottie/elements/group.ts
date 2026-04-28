import type { GroupElement, Element } from '@/types/element'
import type { Track } from '@/types/track'
import type { LottiePrecompLayer, LottieAssetComp, LottieLayer, LottieAsset } from '../types'
import { buildTransform } from '../tracks'

export interface GroupBuildCtx {
  elementMap: Map<string, Element>
  assets: LottieAsset[]
  frameWidth: number
  frameHeight: number
  buildChild: (el: Element, ind: number) => LottieLayer | null
}

export function buildGroup(
  el: GroupElement,
  tracks: Track[],
  totalFrames: number,
  ctx: GroupBuildCtx,
): LottiePrecompLayer {
  const { frameWidth: w, frameHeight: h } = ctx
  const finalLayers: LottieLayer[] = []

  if (el.hasMask && el.childIds.length >= 2) {
    // childIds[0] = mask shape; childIds[1+] = masked content
    const maskEl = ctx.elementMap.get(el.childIds[0]!)
    if (maskEl?.visible) {
      const layer = ctx.buildChild(maskEl, 0)
      if (layer) finalLayers.push({ ...layer, ind: 0, td: 1 } as LottieLayer)
    }
    for (let i = 1; i < el.childIds.length; i++) {
      const contentEl = ctx.elementMap.get(el.childIds[i]!)
      if (!contentEl?.visible) continue
      const layer = ctx.buildChild(contentEl, i)
      if (layer) finalLayers.push({ ...layer, ind: i, tt: 1 } as LottieLayer)
    }
  } else {
    // Regular group: children in reverse for Lottie layer order (top of stack = index 0)
    const reversed = [...el.childIds].reverse()
    for (let i = 0; i < reversed.length; i++) {
      const childEl = ctx.elementMap.get(reversed[i]!)
      if (!childEl?.visible) continue
      const layer = ctx.buildChild(childEl, i)
      if (layer) finalLayers.push({ ...layer, ind: i } as LottieLayer)
    }
  }

  const assetId = `comp_${el.id}`
  const asset: LottieAssetComp = { id: assetId, layers: finalLayers, w, h }
  ctx.assets.push(asset)

  return {
    ty: 0,
    refId: assetId,
    ind: 0,
    ip: 0, op: totalFrames, st: 0,
    nm: el.name || 'Group',
    sr: 1, ao: 0,
    w, h,
    ks: buildTransform(el, tracks, totalFrames),
  }
}
