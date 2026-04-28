import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolType } from '@/types/tool'
import { useSelectionStore } from './useSelectionStore'

export const useToolStore = defineStore('tool', () => {
  const currentTool = ref<ToolType>('select')
  const toolOptions = ref<Record<string, Record<string, unknown>>>({})

  function setTool(t: ToolType): void {
    if (currentTool.value === 'select' && t !== 'select') {
      useSelectionStore().exitPathEditMode()
    }
    currentTool.value = t
  }

  function setToolOption(toolId: string, key: string, value: unknown): void {
    const current = toolOptions.value[toolId]
    if (current == null) {
      toolOptions.value[toolId] = { [key]: value }
    } else {
      current[key] = value
    }
  }

  return { currentTool, toolOptions, setTool, setToolOption }
})
