import { ref, computed } from 'vue'
import { useViewportStore } from '@/stores/useViewportStore'
import type { Point } from '@/types/geometry'

// Singleton — set once by EditorCanvas on mount
const _svgRef = ref<SVGSVGElement | null>(null)

export function useCanvasViewport() {
  const viewport = useViewportStore()

  const transformStr = computed(
    () => `translate(${viewport.panX} ${viewport.panY}) scale(${viewport.zoom})`,
  )

  function setSvgRef(el: SVGSVGElement | null): void {
    _svgRef.value = el
  }

  function screenToSvg(clientX: number, clientY: number): Point {
    const rect = _svgRef.value?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - viewport.panX) / viewport.zoom,
      y: (clientY - rect.top - viewport.panY) / viewport.zoom,
    }
  }

  function fitActiveArtboard(w: number, h: number): void {
    const el = _svgRef.value
    if (!el) return
    viewport.fitToView(w, h, el as unknown as HTMLElement)
  }

  function onWheelZoom(e: WheelEvent): void {
    const rect = _svgRef.value?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const oldZoom = viewport.zoom
    viewport.setZoom(oldZoom * factor)
    const newZoom = viewport.zoom
    // Keep mouse position anchored in world space
    const worldX = (mouseX - viewport.panX) / oldZoom
    const worldY = (mouseY - viewport.panY) / oldZoom
    viewport.pan(mouseX - worldX * newZoom - viewport.panX, mouseY - worldY * newZoom - viewport.panY)
  }

  return { transformStr, setSvgRef, screenToSvg, onWheelZoom, fitActiveArtboard }
}
