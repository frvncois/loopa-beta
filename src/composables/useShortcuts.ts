import { useToolStore } from '@/stores/useToolStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useClipboardStore } from '@/stores/useClipboardStore'
import { useViewportStore } from '@/stores/useViewportStore'
import { useKeyframeSelection } from './useKeyframeSelection'
import { useEditorModals } from './useEditorModals'
import { useCanvasViewport } from '@/features/canvas/composables/useCanvasViewport'
import type { ToolType } from '@/types/tool'

// Module-level: space-hold state
let _spaceDown = false
let _prevTool: ToolType | null = null

const TOOL_KEYS: Record<string, ToolType> = {
  v: 'select',
  h: 'hand',
  r: 'rect',
  e: 'ellipse',
  l: 'line',
  p: 'pen',
  t: 'text',
  m: 'motion-path',
  n: 'polygon',
  s: 'star',
}

function isInputTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function useShortcuts() {
  const tool      = useToolStore()
  const selection = useSelectionStore()
  const doc       = useDocumentStore()
  const history   = useHistoryStore()
  const clipboard = useClipboardStore()
  const viewport  = useViewportStore()
  const modals    = useEditorModals()
  const { fitActiveArtboard } = useCanvasViewport()

  function activeArtboardId(): string {
    return selection.activeArtboardId ?? ''
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (isInputTarget(e)) return

    // Space → temporary hand tool (hold)
    if (e.key === ' ' && !e.repeat && !_spaceDown) {
      _spaceDown = true
      _prevTool  = tool.currentTool
      tool.setTool('hand')
      e.preventDefault()
      return
    }

    const meta  = e.metaKey || e.ctrlKey
    const shift = e.shiftKey

    // Shortcuts modal
    if (meta && e.key === '/') {
      e.preventDefault()
      modals.showShortcuts.value = !modals.showShortcuts.value
      return
    }

    // Settings modal
    if (meta && e.key === ',') {
      e.preventDefault()
      modals.showSettings.value = !modals.showSettings.value
      return
    }

    // Save
    if (meta && e.key === 's') {
      e.preventDefault()
      void doc.saveProject()
      return
    }

    // Undo / Redo
    if (meta && e.key === 'z') {
      e.preventDefault()
      shift ? history.redo() : history.undo()
      return
    }

    // Duplicate
    if (meta && e.key === 'd') {
      e.preventDefault()
      const ids = [...selection.selectedIds]
      if (ids.length === 0) return
      history.transact('Duplicate', () => {
        const newIds = doc.duplicateElements(ids)
        selection.selectMany(newIds)
      })
      return
    }

    // Ungroup
    if (meta && shift && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault()
      const ids = [...selection.selectedIds]
      if (ids.length === 0) return
      history.transact('Ungroup', () => {
        const children: string[] = []
        for (const id of ids) {
          const el = doc.elementById(id)
          if (el?.type === 'group') children.push(...doc.ungroupElements(id))
        }
        if (children.length > 0) selection.selectMany(children)
      })
      return
    }

    // Group
    if (meta && e.key === 'g') {
      e.preventDefault()
      const ids = [...selection.selectedIds]
      if (ids.length < 2) return
      history.transact('Group', () => {
        const groupId = doc.groupElements(ids)
        if (groupId) selection.select(groupId)
      })
      return
    }

    // Copy
    if (meta && e.key === 'c') {
      e.preventDefault()
      clipboard.copy([...selection.selectedIds])
      return
    }

    // Cut
    if (meta && e.key === 'x') {
      e.preventDefault()
      const ids = [...selection.selectedIds]
      clipboard.copy(ids)
      history.transact('Cut', () => {
        doc.deleteElements(ids)
        selection.clearSelection()
      })
      return
    }

    // Paste
    if (meta && e.key === 'v') {
      e.preventDefault()
      if (!clipboard.hasPasteData) return
      history.transact('Paste', () => {
        const { elementIds } = clipboard.paste(activeArtboardId())
        selection.selectMany(elementIds)
      })
      return
    }

    // Arrow nudge
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const ids = [...selection.selectedIds]
      if (ids.length === 0) return
      e.preventDefault()
      const step = shift ? 10 : 1
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
      const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
      history.transact('Nudge', () => {
        for (const id of ids) {
          const el = doc.elementById(id)
          if (el) doc.updateElement(id, { x: el.x + dx, y: el.y + dy })
        }
      })
      return
    }

    // Delete / Backspace — keyframes take priority over elements
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const kfSel  = useKeyframeSelection()
      const kfIds  = [...kfSel.selectedIds.value]
      if (kfIds.length > 0) {
        const kfIdSet = new Set(kfIds)
        history.transact('Delete keyframes', () => {
          const toDelete: Array<{ trackId: string; kfId: string }> = []
          for (const track of doc.tracks) {
            for (const kf of track.keyframes) {
              if (kfIdSet.has(kf.id)) toDelete.push({ trackId: track.id, kfId: kf.id })
            }
          }
          for (const { trackId, kfId } of toDelete) doc.deleteKeyframe(trackId, kfId)
          kfSel.clear()
        })
        e.preventDefault()
        return
      }
      const ids = [...selection.selectedIds]
      if (ids.length === 0) return
      history.transact('Delete', () => {
        doc.deleteElements(ids)
        selection.clearSelection()
      })
      e.preventDefault()
      return
    }

    // Zoom in/out
    if (e.key === '+' || e.key === '=') { e.preventDefault(); viewport.zoomIn(); return }
    if (e.key === '-')                  { e.preventDefault(); viewport.zoomOut(); return }

    // Reset view
    if (meta && e.key === '0') {
      e.preventDefault()
      viewport.resetView()
      return
    }

    // Fit to view
    if (meta && e.key === '1') {
      e.preventDefault()
      const artboard = doc.artboards.find((a) => a.id === activeArtboardId())
      if (artboard) fitActiveArtboard(artboard.width, artboard.height)
      return
    }

    // Tool shortcuts (no modifier, no repeat)
    if (!meta && !e.altKey && !e.repeat) {
      const t = TOOL_KEYS[e.key.toLowerCase()]
      if (t) { tool.setTool(t) }
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.key === ' ' && _spaceDown) {
      _spaceDown = false
      if (_prevTool) tool.setTool(_prevTool)
      _prevTool = null
    }
  }

  function register(): void {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  function unregister(): void {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  return { register, unregister }
}
