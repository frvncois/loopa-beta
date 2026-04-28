import { useToolStore } from '@/stores/useToolStore'
import { getToolController } from './registry'
import type { CanvasContext } from './types'

export function createToolDispatcher() {
  function dispatch(
    event: 'pointerdown' | 'pointermove' | 'pointerup',
    e: PointerEvent,
    ctx: CanvasContext,
  ): void {
    const { currentTool } = useToolStore()
    const ctrl = getToolController(currentTool)
    if (!ctrl) return
    if (event === 'pointerdown') ctrl.onPointerDown?.(e, ctx)
    else if (event === 'pointermove') ctrl.onPointerMove?.(e, ctx)
    else if (event === 'pointerup') ctrl.onPointerUp?.(e, ctx)
  }

  function dispatchKeyDown(e: KeyboardEvent, ctx: CanvasContext): void {
    const { currentTool } = useToolStore()
    const ctrl = getToolController(currentTool)
    ctrl?.onKeyDown?.(e, ctx)
  }

  return { dispatch, dispatchKeyDown }
}
