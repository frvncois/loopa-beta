import type { ToolType } from '@/types/tool'
import type { ToolController } from './types'

const registry = new Map<ToolType, ToolController>()

export function registerTool(id: ToolType, controller: ToolController): void {
  registry.set(id, controller)
}

export function getToolController(id: ToolType): ToolController | undefined {
  return registry.get(id)
}
