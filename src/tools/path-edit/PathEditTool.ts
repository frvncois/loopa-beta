import { useSelectionStore } from '@/stores/useSelectionStore'
import { registerTool } from '../_base/registry'
import type { ToolController } from '../_base/types'

// Path-edit is a virtual mode, not a user-selectable tool.
// Handles only: ESC to exit, clicking outside an element to exit.

const PathEditTool: ToolController = {
  onPointerDown(e, _ctx) {
    // If the event reached the tool (not stopped by PathPointHandles), the user
    // clicked on empty space or a non-interactive element → exit edit mode.
    const target = e.target as SVGElement
    const onElement = target.closest('[data-element-id]')
    if (!onElement) {
      useSelectionStore().exitPathEditMode()
    }
  },

  onKeyDown(e, _ctx) {
    if (e.key === 'Escape') {
      useSelectionStore().exitPathEditMode()
      e.preventDefault()
    }
  },
}

registerTool('path-edit', PathEditTool)
