import { useTimelineStore } from '@/stores/useTimelineStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

const LABEL_WIDTH = 160
const PPF = 8 // pixels per frame — must match TimelinePanel

function frameFromSvgX(svgX: number, totalFrames: number): number {
  return Math.max(0, Math.min(totalFrames, Math.round((svgX - LABEL_WIDTH) / PPF)))
}

function svgXFromEvent(e: PointerEvent): number {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement
  if (!svg) return 0
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  return pt.matrixTransform(svg.getScreenCTM()!.inverse()).x
}

// ── Ruler / playhead scrubbing ─────────────────────────────────────────────

export function usePlayheadDrag() {
  const timeline = useTimelineStore()

  function onPointerDown(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }

  function onPointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    timeline.seek(frameFromSvgX(svgXFromEvent(e), timeline.totalFrames))
  }

  function onPointerUp(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}

export function useRulerScrub() {
  const timeline = useTimelineStore()

  function onPointerDown(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    timeline.seek(frameFromSvgX(svgXFromEvent(e), timeline.totalFrames))
  }

  function onPointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    timeline.seek(frameFromSvgX(svgXFromEvent(e), timeline.totalFrames))
  }

  function onPointerUp(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}

// ── Keyframe dragging ──────────────────────────────────────────────────────

export function useKeyframeDrag(trackId: string, keyframeId: string) {
  const doc = useDocumentStore()
  const history = useHistoryStore()
  const timeline = useTimelineStore()

  function onPointerDown(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    history.beginTransaction('Move keyframe')
    e.stopPropagation()
  }

  function onPointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    const newFrame = frameFromSvgX(svgXFromEvent(e), timeline.totalFrames)
    const track = doc.tracks.find((t) => t.id === trackId)
    if (!track) return
    const kf = track.keyframes.find((k) => k.id === keyframeId)
    if (!kf) return
    kf.frame = newFrame
    // Re-sort keyframes by frame
    track.keyframes.sort((a, b) => a.frame - b.frame)
  }

  function onPointerUp(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
    history.commit()
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
