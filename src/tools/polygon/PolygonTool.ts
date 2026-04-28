import { registerTool } from '../_base/registry'
import { makeDrawTool } from '../_base/makeDrawTool'

registerTool('polygon', makeDrawTool('polygon'))
