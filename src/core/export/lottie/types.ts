// Internal Lottie JSON structure types

export interface LottieKeyframe {
  t: number
  s: number[]
  i?: { x: number[]; y: number[] }
  o?: { x: number[]; y: number[] }
}

export type LottieStatic   = { a: 0; k: number | number[] }
export type LottieAnimated = { a: 1; k: LottieKeyframe[] }
export type LottieAnimatable = LottieStatic | LottieAnimated

export interface LottieTransform {
  a: LottieAnimatable   // anchor point (element-local)
  p: LottieAnimatable   // position (canvas-space)
  s: LottieAnimatable   // scale ×100 per axis
  r: LottieAnimatable   // rotation (degrees)
  o: LottieAnimatable   // opacity ×100
}

export interface LottieFill {
  ty: 'fl'
  c: LottieAnimatable
  o: LottieAnimatable
  r: number             // fill rule 1=nonzero 2=evenodd
}

export interface LottieStroke {
  ty: 'st'
  c: LottieAnimatable
  o: LottieAnimatable
  w: LottieAnimatable
  lc: number
  lj: number
  ml: number
}

export interface LottieAssetImage {
  id: string
  w: number
  h: number
  u: string
  p: string   // data URI or filename
  e: number   // 1 = embedded
}

export interface LottieAssetComp {
  id: string
  layers: LottieLayer[]
  w: number
  h: number
}

export type LottieAsset = LottieAssetImage | LottieAssetComp

export interface LottieShapeLayer {
  ty: 4
  ind: number
  ip: number; op: number; st: number
  nm: string; sr: number; ao: number
  ks: LottieTransform
  shapes: unknown[]
}

export interface LottieTextLayer {
  ty: 5
  ind: number
  ip: number; op: number; st: number
  nm: string; sr: number; ao: number
  ks: LottieTransform
  t: unknown
}

export interface LottieImageLayer {
  ty: 2
  refId: string
  ind: number
  ip: number; op: number; st: number
  nm: string; sr: number; ao: number
  ks: LottieTransform
}

export interface LottiePrecompLayer {
  ty: 0
  refId: string
  ind: number
  ip: number; op: number; st: number
  nm: string; sr: number; ao: number
  ks: LottieTransform
  w: number; h: number
  td?: number
  tt?: number
}

export type LottieLayer =
  | LottieShapeLayer
  | LottieTextLayer
  | LottieImageLayer
  | LottiePrecompLayer
