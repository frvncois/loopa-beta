export type ToolType =
  | 'select' | 'hand' | 'rect' | 'ellipse' | 'line'
  | 'polygon' | 'star' | 'text' | 'pen' | 'motion-path' | 'path-edit'

export interface ToolDefinition {
  id: ToolType
  label: string
  shortcut: string
  iconName: string
}
