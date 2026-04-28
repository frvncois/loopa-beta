import type {
  Element, BaseElement,
  RectElement, EllipseElement, LineElement, PolygonElement, StarElement,
  PathElement, TextElement, ImageElement, GroupElement,
} from '@/types/element'

// ── Attribute helpers ─────────────────────────────────────────────────────────

function escAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function escText(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function rotateAttr(el: BaseElement): string {
  if (!el.rotation) return ''
  return ` transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"`
}

function fillStroke(el: BaseElement): string {
  const fill   = el.fills[0]?.visible   ? `#${el.fills[0].color}`   : 'none'
  const fop    = el.fills[0]?.opacity   ?? 1
  const stroke = el.strokes[0]?.visible ? `#${el.strokes[0].color}` : 'none'
  const sw     = el.strokes[0]?.width   ?? 0
  return `fill="${escAttr(fill)}" fill-opacity="${fop}" stroke="${escAttr(stroke)}" stroke-width="${sw}"`
}

function polygonPoints(el: PolygonElement): string {
  const cx = el.x + el.width / 2, cy = el.y + el.height / 2
  const rx = el.width / 2, ry = el.height / 2
  const pts: string[] = []
  for (let i = 0; i < el.sides; i++) {
    const a = (Math.PI * 2 * i) / el.sides - Math.PI / 2
    pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`)
  }
  return pts.join(' ')
}

function starPoints(el: StarElement): string {
  const cx = el.x + el.width / 2, cy = el.y + el.height / 2
  const outerRx = el.width / 2, outerRy = el.height / 2
  const innerRx = outerRx * el.innerRadius, innerRy = outerRy * el.innerRadius
  const total = el.starPoints * 2
  const pts: string[] = []
  for (let i = 0; i < total; i++) {
    const a = (Math.PI * 2 * i) / total - Math.PI / 2
    const rx = i % 2 === 0 ? outerRx : innerRx
    const ry = i % 2 === 0 ? outerRy : innerRy
    pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`)
  }
  return pts.join(' ')
}

// ── Shape builders ────────────────────────────────────────────────────────────

export function rectToSvg(el: RectElement): string {
  const rx = el.radiusTopLeft || el.rx || 0
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" ry="${rx}" ${fillStroke(el)} opacity="${el.opacity}"${rotateAttr(el)} />`
}

export function ellipseToSvg(el: EllipseElement): string {
  return `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" ${fillStroke(el)} opacity="${el.opacity}"${rotateAttr(el)} />`
}

export function lineToSvg(el: LineElement): string {
  const stroke = el.strokes[0]?.visible ? `#${el.strokes[0].color}` : '#ededf0'
  const sw     = el.strokes[0]?.width   ?? 2
  const cx     = el.x + el.width / 2
  const rotate = el.rotation ? ` transform="rotate(${el.rotation} ${cx} ${el.y})"` : ''
  return `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y}" stroke="${escAttr(stroke)}" stroke-width="${sw}" opacity="${el.opacity}"${rotate} />`
}

export function polygonToSvg(el: PolygonElement): string {
  return `<polygon points="${polygonPoints(el)}" ${fillStroke(el)} opacity="${el.opacity}"${rotateAttr(el)} />`
}

export function starToSvg(el: StarElement): string {
  return `<polygon points="${starPoints(el)}" ${fillStroke(el)} opacity="${el.opacity}"${rotateAttr(el)} />`
}

export function pathToSvg(el: PathElement): string {
  if (el.isMotionPath) return ''
  const t = `translate(${el.x} ${el.y})${el.rotation ? ` rotate(${el.rotation} ${el.width / 2} ${el.height / 2})` : ''}`
  return `<path d="${escAttr(el.d)}" fill-rule="${el.fillRule}" transform="${escAttr(t)}" ${fillStroke(el)} opacity="${el.opacity}" />`
}

export function textToSvg(el: TextElement): string {
  const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'
  const fill   = el.fills[0]?.visible ? `#${el.fills[0].color}` : '#ededf0'
  return `<text x="${el.x}" y="${el.y + el.fontSize}" font-size="${el.fontSize}" font-family="${escAttr(el.fontFamily)}" font-weight="${el.fontWeight}" text-anchor="${anchor}" fill="${escAttr(fill)}" opacity="${el.opacity}"${rotateAttr(el)}>${escText(el.text)}</text>`
}

export function imageToSvg(el: ImageElement, dataUri: string | undefined): string {
  const rot = rotateAttr(el)
  if (!dataUri) {
    return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="#1c1c26" opacity="${el.opacity}"${rot} />`
  }
  const par    = el.objectFit === 'cover' ? 'xMidYMid slice' : el.objectFit === 'fill' ? 'none' : 'xMidYMid meet'
  const clipId = `img-clip-${el.id}`
  const clip   = el.objectFit === 'cover'
    ? `<defs><clipPath id="${clipId}"><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" /></clipPath></defs>`
    : ''
  const clipAttr = el.objectFit === 'cover' ? ` clip-path="url(#${clipId})"` : ''
  return `<g${rot}>${clip}<image href="${escAttr(dataUri)}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="${par}"${clipAttr} opacity="${el.opacity}" /></g>`
}

// ── Clip shape (for mask group <clipPath>) ────────────────────────────────────

function toClipShape(el: Element): string {
  const s = 'fill="black" stroke="none"'
  if (el.type === 'rect') {
    const r = el as RectElement
    const rx = r.radiusTopLeft || r.rx || 0
    return `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${rx}" ry="${rx}" ${s}${rotateAttr(r)} />`
  }
  if (el.type === 'ellipse') {
    const e = el as EllipseElement
    return `<ellipse cx="${e.x + e.width / 2}" cy="${e.y + e.height / 2}" rx="${e.width / 2}" ry="${e.height / 2}" ${s}${rotateAttr(e)} />`
  }
  if (el.type === 'path') {
    const p = el as PathElement
    const t = `translate(${p.x} ${p.y})${p.rotation ? ` rotate(${p.rotation} ${p.width / 2} ${p.height / 2})` : ''}`
    return `<path d="${escAttr(p.d)}" transform="${escAttr(t)}" ${s} />`
  }
  if (el.type === 'polygon') {
    return `<polygon points="${polygonPoints(el as PolygonElement)}" ${s}${rotateAttr(el as PolygonElement)} />`
  }
  if (el.type === 'star') {
    return `<polygon points="${starPoints(el as StarElement)}" ${s}${rotateAttr(el as StarElement)} />`
  }
  return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${s} />`
}

// ── Group ─────────────────────────────────────────────────────────────────────

export function groupToSvg(el: GroupElement, maskEl: Element | null, contentSvg: string): string {
  const rot = el.rotation
    ? ` transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"`
    : ''
  if (el.hasMask && maskEl) {
    const clipId = `mask-${el.id}`
    return `<g${rot} opacity="${el.opacity}"><defs><clipPath id="${clipId}">${toClipShape(maskEl)}</clipPath></defs><g clip-path="url(#${clipId})">${contentSvg}</g></g>`
  }
  return `<g${rot} opacity="${el.opacity}">${contentSvg}</g>`
}
