import { ref } from 'vue'
import type { ElementType } from '@/types/element'

export interface DrawPreview {
  type: ElementType
  x: number
  y: number
  width: number
  height: number
}

// Module-level singleton — draw tools write here, OverlayLayer reads
const _preview = ref<DrawPreview | null>(null)

export function useDrawPreview() {
  return {
    preview: _preview as Readonly<typeof _preview>,
    set(p: DrawPreview | null): void {
      _preview.value = p
    },
    clear(): void {
      _preview.value = null
    },
  }
}
