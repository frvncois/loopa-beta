import type { Point } from '@/types/geometry'

export interface CanvasContext {
  frameId: string
  screenToSvg(clientX: number, clientY: number): Point
}

export interface ToolController {
  onPointerDown?(e: PointerEvent, ctx: CanvasContext): void
  onPointerMove?(e: PointerEvent, ctx: CanvasContext): void
  onPointerUp?(e: PointerEvent, ctx: CanvasContext): void
  onKeyDown?(e: KeyboardEvent, ctx: CanvasContext): void
  onActivate?(): void
  onDeactivate?(): void
}
