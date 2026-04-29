import type { Element } from './element'
import type { Track } from './track'
import type { Artboard } from './artboard'
import type { MotionPath } from './motion-path'

export interface ProjectMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  thumbnail: string | null
}

export interface ProjectData {
  meta: ProjectMeta
  artboards: Artboard[]
  elements: Element[]             // ALL elements, flat
  tracks: Track[]                 // ALL tracks, flat
  motionPaths: MotionPath[]
  schemaVersion: number           // bump when shape changes — currently 3
}
