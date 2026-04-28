export interface MotionPath {
  id: string
  elementId: string       // follower element
  pathElementId: string   // hidden PathElement with isMotionPath: true
  loop: boolean
  startFrame: number
  endFrame: number
  rotateAlongPath: boolean
}
