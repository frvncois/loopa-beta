import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateId } from '@/core/utils/id'

export interface Guide {
  id: string
  axis: 'h' | 'v'
  position: number
  locked: boolean
}

const MIN_ZOOM = 0.05
const MAX_ZOOM = 10

export const useViewportStore = defineStore('viewport', () => {
  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const showGrid = ref(false)
  const snapToGrid = ref(false)
  const gridSize = ref(10)
  const showRulers = ref(false)
  const showGuides = ref(true)
  const guides = ref<Guide[]>([])
  const isPanning = ref(false)
  const isTransforming = ref(false)

  function setZoom(z: number): void {
    zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
  }

  function zoomIn(): void {
    setZoom(zoom.value * 1.2)
  }

  function zoomOut(): void {
    setZoom(zoom.value / 1.2)
  }

  function resetView(): void {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
  }

  function fitToView(width: number, height: number, viewportEl: HTMLElement): void {
    const rect = viewportEl.getBoundingClientRect()
    const padding = 40
    const zx = (rect.width - padding * 2) / width
    const zy = (rect.height - padding * 2) / height
    const z = Math.min(zx, zy, MAX_ZOOM)
    setZoom(z)
    panX.value = (rect.width - width * z) / 2
    panY.value = (rect.height - height * z) / 2
  }

  function pan(dx: number, dy: number): void {
    panX.value += dx
    panY.value += dy
  }

  function toggleGrid(): void {
    showGrid.value = !showGrid.value
  }

  function toggleSnap(): void {
    snapToGrid.value = !snapToGrid.value
  }

  function toggleRulers(): void {
    showRulers.value = !showRulers.value
  }

  function toggleGuides(): void {
    showGuides.value = !showGuides.value
  }

  function addGuide(axis: 'h' | 'v', position: number): Guide {
    const guide: Guide = { id: generateId('guide'), axis, position, locked: false }
    guides.value.push(guide)
    return guide
  }

  function updateGuidePosition(id: string, position: number): void {
    const g = guides.value.find((g) => g.id === id)
    if (g) g.position = position
  }

  function removeGuide(id: string): void {
    guides.value = guides.value.filter((g) => g.id !== id)
  }

  function toggleGuideLock(id: string): void {
    const g = guides.value.find((g) => g.id === id)
    if (g) g.locked = !g.locked
  }

  function setTransforming(v: boolean): void {
    isTransforming.value = v
  }

  return {
    zoom,
    panX,
    panY,
    showGrid,
    snapToGrid,
    gridSize,
    showRulers,
    showGuides,
    guides,
    isPanning,
    isTransforming,
    setZoom,
    zoomIn,
    zoomOut,
    resetView,
    fitToView,
    pan,
    toggleGrid,
    toggleSnap,
    toggleRulers,
    toggleGuides,
    addGuide,
    updateGuidePosition,
    removeGuide,
    toggleGuideLock,
    setTransforming,
  }
})
