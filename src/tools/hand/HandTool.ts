import { registerTool } from '../_base/registry'
import type { ToolController } from '../_base/types'

// Panning is handled entirely in useCanvasInteractions for the hand tool.
// This stub registers the tool so the registry isn't empty.
const HandTool: ToolController = {}

registerTool('hand', HandTool)
