<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref, useTemplateRef } from 'vue'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useViewportStore } from '@/stores/useViewportStore'
import { useCanvasViewport } from './composables/useCanvasViewport'
import { useCanvasInteractions } from './composables/useCanvasInteractions'
import CanvasFramesLayer from './layers/CanvasFramesLayer.vue'
import SelectionLayer from './layers/SelectionLayer.vue'
import OverlayLayer from './layers/OverlayLayer.vue'
import CanvasContextMenu from './CanvasContextMenu.vue'
import CanvasOnboarding from './CanvasOnboarding.vue'
import { useFrameActivation } from '@/composables/useFrameActivation'
import { useAddMedia } from '@/composables/useAddMedia'

const doc       = useDocumentStore()
const selection = useSelectionStore()
const viewport  = useViewportStore()
const { transformStr, setSvgRef, screenToSvg, fitActiveFrame } = useCanvasViewport()
const { activateFrame } = useFrameActivation()
const { addImageFile, addVideoFile } = useAddMedia()

const svgRef = useTemplateRef<SVGSVGElement>('svg')

// ── Active frame ───────────────────────────────────────────────────────────
onMounted(() => {
  setSvgRef(svgRef.value)

  if (doc.frames.length === 0) {
    const frameId = doc.addFrame('Frame 1', 1280, 720)
    activateFrame(frameId)
  } else {
    const targetId = selection.activeFrameId ?? doc.frames[0]?.id
    if (targetId) activateFrame(targetId)
  }

  if (svgRef.value && doc.frames[0]) {
    fitActiveFrame(doc.frames[0].width, doc.frames[0].height)
  }
})

onBeforeUnmount(() => setSvgRef(null))

const activeFrameId = computed(() => selection.activeFrameId ?? '')

// ── Interactions ───────────────────────────────────────────────────────────
const { onPointerDown, onPointerMove, onPointerUp, onWheel, onKeyDown: toolKeyDown } =
  useCanvasInteractions(() => activeFrameId.value)

// ── Drag-drop media ─────────────────────────────────────────────────────────
function onDrop(e: DragEvent): void {
  e.preventDefault()
  const frameId = activeFrameId.value
  if (!frameId || !e.dataTransfer) return
  const { x: dropX, y: dropY } = screenToSvg(e.clientX, e.clientY)

  for (const file of Array.from(e.dataTransfer.files)) {
    if (file.type.startsWith('image/')) {
      void addImageFile(file, frameId, dropX, dropY)
    } else if (file.type.startsWith('video/')) {
      void addVideoFile(file, frameId, dropX, dropY)
    }
  }
}

// ── Context menu ───────────────────────────────────────────────────────────
const ctxShow = ref(false)
const ctxX    = ref(0)
const ctxY    = ref(0)

function onContextMenu(e: MouseEvent): void {
  e.preventDefault()
  ctxX.value = e.clientX
  ctxY.value = e.clientY
  ctxShow.value = true
}

// ── Tool key forwarding ─────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement
  if (target !== document.body && target.tagName !== 'svg') return
  toolKeyDown(e)
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div
    class="flex-1 overflow-auto min-h-0 bg-bg-1 relative select-none"
    @dragover.prevent
    @drop="onDrop"
    @contextmenu.prevent="onContextMenu"
  >
    <svg
      ref="svg"
      class="w-full h-full"
      style="touch-action: none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @wheel.prevent="onWheel"
    >
      <g :transform="transformStr">
        <CanvasFramesLayer />
        <SelectionLayer />
        <OverlayLayer />
      </g>
    </svg>

    <CanvasOnboarding />

    <CanvasContextMenu
      :show="ctxShow"
      :x="ctxX"
      :y="ctxY"
      :frame-id="activeFrameId"
      @close="ctxShow = false"
    />
  </div>
</template>
