export type ArtboardNavigationTrigger = 'on-complete' | 'on-click'

export interface Artboard {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  elementIds: string[]            // top-level element IDs in this artboard
  order: number
  fps: number
  totalFrames: number
  loop: boolean
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  canvasX: number                 // position on infinite canvas
  canvasY: number
}
