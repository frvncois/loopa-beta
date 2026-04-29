import { useToolStore } from '@/stores/useToolStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { registerTool } from '../_base/registry'
import type { ToolController } from '../_base/types'

const ShapeEditTool: ToolController = {
  onPointerDown(e, _ctx) {
    const elementEl = (e.target as SVGElement).closest('[data-element-id]')
    const clickedId = elementEl?.getAttribute('data-element-id') ?? null
    const sel       = useSelectionStore()
    if (!clickedId || !sel.selectedIds.includes(clickedId)) {
      useToolStore().setTool('select')
    }
  },
  onKeyDown(e, _ctx) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      useToolStore().setTool('select')
      e.preventDefault()
    }
  },
}

registerTool('shape-edit', ShapeEditTool)
