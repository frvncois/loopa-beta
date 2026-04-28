import type { PathPoint } from './element'

export type EasingType =
  | 'linear'
  | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic'
  | 'ease-in-back' | 'ease-out-back' | 'ease-in-out-back'
  | 'ease-out-bounce' | 'ease-out-elastic'
  | `cubic-bezier(${number},${number},${number},${number})`
  | `steps(${number})`

export type KeyframeValue = number | string | PathPoint[]

export interface Keyframe {
  id: string
  frame: number
  value: KeyframeValue
  easing: EasingType
}

/**
 * String path into an Element. Examples:
 *   'x', 'y', 'opacity', 'rotation'
 *   'fills.0.color', 'fills.0.opacity'
 *   'strokes.0.width'
 *   'shadows.0.x', 'shadows.0.blur'
 *   'fontSize', 'letterSpacing'
 *   'rx', 'd', 'points'
 *   'transformOrigin.x'
 */
export type PropertyPath = string

export interface Track {
  id: string
  elementId: string
  property: PropertyPath
  keyframes: Keyframe[]      // sorted by frame ascending; invariant maintained on mutation
  enabled: boolean
}
