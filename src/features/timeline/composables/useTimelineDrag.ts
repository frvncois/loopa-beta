import type { Track } from '@/types/track'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useKeyframeSelection } from './useKeyframeSelection'

const LABEL_WIDTH = 160

function svgXFromEvent(e: PointerEvent): number {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement
  if (!svg) return 0
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  return pt.matrixTransform(svg.getScreenCTM()!.inverse()).x
}

function ppfFromEvent(e: PointerEvent, totalFrames: number): number {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement
  if (!svg || totalFrames <= 0) return 8
  const w = parseFloat(svg.getAttribute('width') ?? '0') || svg.getBoundingClientRect().width
  return w > LABEL_WIDTH ? (w - LABEL_WIDTH) / totalFrames : 8
}

function frameFromX(svgX: number, ppf: number, totalFrames: number): number {
  return Math.max(0, Math.min(totalFrames, Math.round((svgX - LABEL_WIDTH) / ppf)))
}

// ── Playhead drag ──────────────────────────────────────────────────────────

export function usePlayheadDrag() {
  const timeline = useTimelineStore()

  function onPointerDown(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }

  function onPointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    timeline.seek(frameFromX(svgXFromEvent(e), ppfFromEvent(e, timeline.totalFrames), timeline.totalFrames))
  }

  function onPointerUp(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}

// ── Ruler scrub ────────────────────────────────────────────────────────────

export function useRulerScrub(pixelsPerFrame: () => number) {
  const timeline = useTimelineStore()

  function seek(e: PointerEvent): void {
    timeline.seek(frameFromX(svgXFromEvent(e), pixelsPerFrame(), timeline.totalFrames))
  }

  function onPointerDown(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    seek(e)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    seek(e)
  }

  function onPointerUp(e: PointerEvent): void {
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}

// ── Keyframe selection + drag ──────────────────────────────────────────────

export function useKeyframesDrag(pixelsPerFrame: () => number) {
  const doc      = useDocumentStore()
  const history  = useHistoryStore()
  const timeline = useTimelineStore()
  const kfSel    = useKeyframeSelection()

  let dragStartX = 0
  let hasMoved   = false
  const originalFrames = new Map<string, number>()

  function onKeyframePointerDown(
    e: PointerEvent,
    keyframeIds: string[],
    frame: number,
    additive: boolean,
  ): void {
    e.stopPropagation()
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)

    if (additive) {
      kfSel.addToSelection(keyframeIds)
    } else if (!keyframeIds.some(id => kfSel.isSelected(id))) {
      kfSel.select(keyframeIds)
    }
    // Clicking an already-selected diamond: keep selection, just start drag

    timeline.seek(frame)
    dragStartX = svgXFromEvent(e)
    hasMoved   = false
    originalFrames.clear()

    for (const track of doc.tracks as Track[]) {
      for (const kf of track.keyframes) {
        if (kfSel.isSelected(kf.id)) {
          originalFrames.set(kf.id, kf.frame)
        }
      }
    }

    history.beginTransaction('Move keyframes')
  }

  function onKeyframePointerMove(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    const deltaFrames = Math.round((svgXFromEvent(e) - dragStartX) / pixelsPerFrame())
    if (deltaFrames === 0 && !hasMoved) return
    hasMoved = true

    const dirtyTracks = new Set<Track>()
    for (const track of doc.tracks as Track[]) {
      for (const kf of track.keyframes) {
        const orig = originalFrames.get(kf.id)
        if (orig !== undefined) {
          kf.frame = Math.max(0, Math.min(timeline.totalFrames, orig + deltaFrames))
          dirtyTracks.add(track)
        }
      }
    }
    for (const track of dirtyTracks) {
      track.keyframes.sort((a, b) => a.frame - b.frame)
    }
  }

  function onKeyframePointerUp(e: PointerEvent): void {
    if (!(e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) return
    ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
    hasMoved ? history.commit() : history.cancel()
    originalFrames.clear()
  }

  return { onKeyframePointerDown, onKeyframePointerMove, onKeyframePointerUp }
}
