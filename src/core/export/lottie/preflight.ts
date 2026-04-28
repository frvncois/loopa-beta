import type { Element, GroupElement } from '@/types/element'
import type { ProjectData } from '@/types/project'
import type { Frame } from '@/types/frame'
import type { PreflightReport, PreflightIssue } from '@/types/export'
import { needsBaking } from './easing'

interface PreflightInput {
  project: ProjectData
  frame: Frame
}

function walkElements(frame: Frame, elementMap: Map<string, Element>): Element[] {
  const result: Element[] = []
  function walk(id: string) {
    const el = elementMap.get(id)
    if (!el) return
    result.push(el)
    if (el.type === 'group') (el as GroupElement).childIds.forEach(walk)
  }
  frame.elementIds.forEach(walk)
  return result
}

export function preflightLottie(input: PreflightInput): PreflightReport {
  const { project, frame } = input
  const issues: PreflightIssue[] = []

  const elementMap = new Map(project.elements.map(e => [e.id, e]))
  const elements   = walkElements(frame, elementMap)

  for (const el of elements) {
    // Video elements → warning
    if (el.type === 'video') {
      issues.push({
        severity: 'warning',
        code: 'video-unsupported',
        message: `Video element '${el.name || el.id}' will not appear — Lottie does not support video.`,
        elementId: el.id,
        elementName: el.name,
      })
    }

    // Mask groups with >2 children → warning
    if (el.type === 'group' && (el as GroupElement).hasMask) {
      const g = el as GroupElement
      if (g.childIds.length > 2) {
        issues.push({
          severity: 'warning',
          code: 'mask-multiple-children',
          message: `Mask group '${el.name || el.id}' has ${g.childIds.length} children — only the first pair is fully supported.`,
          elementId: el.id,
          elementName: el.name,
        })
      }
    }
  }

  // Motion paths → info
  const motionPaths = project.motionPaths.filter(mp => {
    const el = elementMap.get(mp.elementId)
    return el !== undefined
  })
  for (const mp of motionPaths) {
    const el = elementMap.get(mp.elementId)
    issues.push({
      severity: 'info',
      code: 'motion-path-baked',
      message: `Motion path on '${el?.name || mp.elementId}' was baked to position keyframes.`,
      elementId: mp.elementId,
      elementName: el?.name,
    })
  }

  // Tracks with bakeable easings → info
  const seenElements = new Set<string>()
  for (const track of project.tracks) {
    const el = elementMap.get(track.elementId)
    if (!el) continue
    const hasBakeable = track.keyframes.some(k => needsBaking(k.easing))
    if (hasBakeable && !seenElements.has(track.elementId)) {
      seenElements.add(track.elementId)
      issues.push({
        severity: 'info',
        code: 'easing-baked',
        message: `Bounce/elastic/steps easing on '${el.name || track.elementId}' was baked to per-frame keyframes.`,
        elementId: track.elementId,
        elementName: el.name,
      })
    }
  }

  return { format: 'lottie', issues, canExport: !issues.some(i => i.severity === 'error') }
}
