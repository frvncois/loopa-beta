import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useToolStore } from '@/stores/useToolStore'
import { createDefaultElement } from '@/core/elements/factory'
import { registerTool } from '../_base/registry'
import type { ToolController } from '../_base/types'

const TextTool: ToolController = {
  onPointerDown(e, ctx) {
    const pt = ctx.screenToSvg(e.clientX, e.clientY)
    const doc = useDocumentStore()
    const selection = useSelectionStore()
    const history = useHistoryStore()
    const tool = useToolStore()

    const el = createDefaultElement('text')
    Object.assign(el, { x: pt.x, y: pt.y })

    history.transact('Add text', () => {
      doc.addElement(el, ctx.frameId)
      selection.select(el.id)
    })
    tool.setTool('select')
  },
}

registerTool('text', TextTool)
