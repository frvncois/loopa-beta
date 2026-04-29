# REBUILD.md — Loopa v2

**Read CLAUDE.md first.** This document assumes you've internalized the conventions. It contains the architecture rationale, full type contracts, store APIs, UI primitive specs, and a phased build plan.

Each phase ends in something runnable. Don't move on until the "done when" criteria are met.

---

## Table of Contents

1. [Architecture (the why)](#1-architecture-the-why)
2. [Folder Structure](#2-folder-structure)
3. [Type Definitions](#3-type-definitions)
4. [Core Domain](#4-core-domain)
5. [Stores](#5-stores)
6. [Composables](#6-composables)
7. [UI Primitives](#7-ui-primitives)
8. [Tools](#8-tools)
9. [Features](#9-features)
10. [Build Phases](#10-build-phases)

---

## 1. Architecture (the why)

### One document store, many UI stores

The v1 monolith (686 lines) blended persisted document state, ephemeral UI state, and side-effects (IndexedDB cleanup) into one store. v2 splits these:

- **`useDocumentStore`** is the persisted document — the only thing that gets serialized to disk. Pure data + mutations.
- **UI state stores** (selection, viewport, tool, timeline) are ephemeral. They're reset between sessions or navigations.
- **`useHistoryStore`** snapshots the document at transaction boundaries.

This makes "save" trivial (`repo.save(document.serialize())`) and undo/redo correct (snapshot the right thing).

### Tracks own keyframes, not elements

v1 stored animations as flat keyframe patches with hard-coded property names (`fillColor`, `shadowOffsetX`). The "merge animated props back into a nested Element" layer was 100+ lines of fragile mapping code.

v2 uses **per-property tracks**:

```
Track { elementId, property: 'fills.0.color', keyframes: [...] }
```

This is how After Effects, Lottie, GSAP, and every professional tool models animation. It eliminates the reconstruction layer entirely. The animation engine becomes a pure function from `(element, tracks, frame) → AnimatedElement`. The timeline UI is one row per track, which matches user mental model.

### Repository pattern for persistence

Stores never know whether projects live in localStorage, IndexedDB, or a remote API. They call interfaces:

```ts
interface ProjectRepository {
  list(): Promise<ProjectMeta[]>
  load(id: string): Promise<ProjectData | null>
  save(id: string, data: ProjectData): Promise<void>
  delete(id: string): Promise<void>
}
```

Today: `LocalProjectRepo` (localStorage). Tomorrow: `RemoteProjectRepo` without touching a single store. Async-by-default per your decision.

### Tools as self-contained modules

v1's `CanvasViewport.onMouseDown` was a giant if/else routing 10+ tools. v2 has a `ToolDispatcher`:

```ts
// canvas calls this:
toolDispatcher.dispatch('pointerdown', event, canvasContext)
// which forwards to the active tool's handler
```

Each tool is a folder with:
- `XxxTool.ts` — controller (pointer handlers, state)
- `XxxOverlay.vue` — optional canvas overlay
- (rare) `XxxCursor.vue` — custom cursor visualization

The canvas knows nothing about specific tools. New tools = new folder, register, done.

### Transactions for undo/redo

v1's `editor.$onAction(({ name }) => { if (['updateElement', 'addKeyframe', ...].includes(name)) history.save() })` is a code smell — the history layer enumerates store actions by string name. Adding a new mutation means remembering to add it to that list.

v2: explicit `history.transact(label, fn)`. Mutations within `fn` produce one undo entry. Continuous actions use `beginTransaction`/`commit`. The history layer doesn't know what mutations exist.

### Inspector primitives, not duplicated CSS

v1's 24 inspector sections each redefined `.field`, `.label`, `.row` in scoped CSS with the same values. v2 has primitives in `src/ui/inspector/`. A typical section is now ~30 lines of markup. Visual consistency comes from shared components, not from "everyone follow the convention."

---

## 2. Folder Structure

```
src/
├── main.ts
├── App.vue
├── env.d.ts
│
├── assets/styles/
│   └── main.css                         # Tailwind v4 entry + @theme tokens
│
├── types/
│   ├── element.ts                       # Element, BaseElement, all variants, FillEntry, StrokeEntry, ShadowEntry
│   ├── track.ts                         # Track, Keyframe, EasingType, PropertyPath
│   ├── artboard.ts                      # Artboard, ArtboardNavigationTrigger
│   ├── motion-path.ts                   # MotionPath
│   ├── tool.ts                          # ToolType, ToolDefinition
│   ├── project.ts                       # ProjectMeta, ProjectData
│   ├── export.ts                        # ExportFormat, ExportJob, RenderedFrame, MediaLayer, PreflightReport, ...
│   ├── geometry.ts                      # Bounds, Point, Rect
│   ├── auth.ts                          # User, UserProfile, AuthStatus
│   ├── cloud.ts                         # CloudProjectMeta, CloudProject, SaveStatus, DocumentLocation, OwnershipTransfer
│   ├── shims/gifenc.d.ts                # Hand-written type shim for gifenc
│   └── index.ts                         # barrel
│
├── core/                                # ZERO Vue imports
│   ├── animation/
│   │   ├── easing.ts                    # all easing functions + getEasingFn()
│   │   ├── interpolate.ts               # number, color, path, generic
│   │   ├── tracks.ts                    # computeTrackValueAt(track, frame)
│   │   ├── engine.ts                    # computeElementAt(element, tracks, frame)
│   │   ├── propertyGroups.ts            # getPropertyGroup(property) → timeline grouping
│   │   └── snapshotProperties.ts        # getSnapshotProperties(el) → animatable property list
│   ├── elements/
│   │   ├── factory.ts                   # createDefaultElement(type)
│   │   └── bounds.ts                    # getBounds(el), getMultiBounds([])
│   ├── path/
│   │   ├── builder.ts                   # PathPoint[] → SVG d
│   │   └── motionPathMath.ts            # point at progress along path
│   ├── export/
│   │   ├── imageData.ts                 # gatherImageData(), blobToDataUri() — shared by useExport + useThumbnail
│   │   ├── lottie/                      # buildLottie(), preflightLottie(), per-element mappers, easing translation
│   │   ├── render/                      # renderProjectAtFrame(), svgBuilder.ts
│   │   └── raster/                      # composeFrame, renderJob, png, gif, video (mp4+webm)
│   ├── persistence/
│   │   ├── ProjectRepository.ts         # interface
│   │   ├── LocalProjectRepo.ts          # localStorage impl
│   │   ├── MediaRepository.ts           # interface
│   │   └── IDBMediaRepo.ts              # IndexedDB impl for video/image blobs
│   └── utils/
│       ├── id.ts                        # generateId(prefix?)
│       ├── math.ts                      # clamp, lerp, snap, distance
│       ├── color.ts                     # hex parsing/formatting
│       ├── valueAtPath.ts               # get/set object via 'a.b.0.c' path
│       ├── cn.ts                        # clsx + tailwind-merge wrapper
│       └── deepClone.ts                 # structured clone with fallback
│
├── stores/
│   ├── useDocumentStore.ts
│   ├── documentDuplicateActions.ts      # factory functions imported by useDocumentStore (not Pinia stores)
│   ├── documentMaskActions.ts
│   ├── documentTrackActions.ts
│   ├── useSelectionStore.ts
│   ├── useViewportStore.ts
│   ├── useToolStore.ts
│   ├── useTimelineStore.ts
│   ├── useHistoryStore.ts
│   ├── useClipboardStore.ts
│   ├── useExportStore.ts
│   └── useAuthStore.ts
│
├── composables/
│   ├── useAnimatedElement.ts            # current-frame element with track values applied
│   ├── useAnimatedProperty.ts           # bidirectional binding for inspector fields
│   ├── usePointer.ts                    # screenToSvg + drag helper
│   ├── useShortcuts.ts                  # global keydown registration
│   ├── useAutosave.ts                   # debounced repo.save()
│   ├── useTextMeasurer.ts               # SVG text bounds via getBBox
│   └── useResizable.ts                  # for ResizablePanel
│
├── ui/
│   ├── Button.vue
│   ├── IconButton.vue
│   ├── NumberField.vue
│   ├── TextField.vue
│   ├── Select.vue
│   ├── ColorField.vue
│   ├── Slider.vue
│   ├── Toggle.vue
│   ├── Checkbox.vue
│   ├── Tooltip.vue
│   ├── Popover.vue
│   ├── ContextMenu.vue
│   ├── Modal.vue
│   ├── ConfirmDialog.vue
│   ├── EmptyState.vue
│   ├── Divider.vue
│   ├── ResizablePanel.vue
│   ├── PanelHeader.vue
│   ├── inspector/
│   │   ├── Section.vue
│   │   ├── CollapsibleSection.vue
│   │   ├── Row.vue
│   │   ├── Label.vue
│   │   └── PairedField.vue
│   └── icons/
│       ├── index.ts                     # barrel
│       └── Icon*.vue                    # ~50 SVG icons
│
├── tools/
│   ├── _base/
│   │   ├── types.ts                     # ToolController, CanvasContext
│   │   ├── toolRegistry.ts              # register / get tool by id
│   │   └── ToolDispatcher.ts            # dispatch pointer events to active tool
│   ├── select/
│   │   ├── SelectTool.ts
│   │   ├── MarqueeOverlay.vue
│   │   └── SelectionOverlay.vue
│   ├── hand/HandTool.ts
│   ├── rect/RectTool.ts
│   ├── ellipse/EllipseTool.ts
│   ├── line/LineTool.ts
│   ├── polygon/PolygonTool.ts
│   ├── star/StarTool.ts
│   ├── text/TextTool.ts
│   ├── pen/
│   │   ├── PenTool.ts
│   │   └── PenOverlay.vue
│   └── path-edit/
│       ├── PathEditTool.ts
│       └── motion-path/
│           └── MotionPathTool.ts        # motion-path tool is nested under path-edit/
│
├── features/
│   ├── canvas/
│   │   ├── EditorCanvas.vue              # ~150 lines: orchestrates layers + dispatch
│   │   ├── layers/
│   │   │   ├── CanvasArtboardsLayer.vue  # artboard backgrounds + outlines + labels
│   │   │   ├── OverlayLayer.vue          # tool overlays slot, marquee, draw preview
│   │   │   └── SelectionLayer.vue
│   │   ├── renderers/
│   │   │   └── ElementRenderer.vue       # type-dispatch to shape components
│   │   ├── shapes/
│   │   │   ├── RectShape.vue
│   │   │   ├── EllipseShape.vue
│   │   │   ├── LineShape.vue
│   │   │   ├── PolygonShape.vue
│   │   │   ├── StarShape.vue
│   │   │   ├── TextShape.vue
│   │   │   ├── PathShape.vue
│   │   │   ├── GroupShape.vue            # recursive
│   │   │   ├── ImageShape.vue
│   │   │   └── VideoShape.vue
│   │   └── composables/
│   │       ├── useCanvasViewport.ts      # pan/zoom/screenToSvg
│   │       ├── useCanvasInteractions.ts  # routes pointer events to ToolDispatcher
│   │       ├── useElementTransform.ts    # unified drag/resize/rotate
│   │       └── useInlineTextEdit.ts
│   │
│   ├── layers/
│   │   ├── LayersPanel.vue
│   │   ├── ArtboardRow.vue
│   │   └── ElementRow.vue
│   │
│   ├── properties/
│   │   ├── PropertiesPanel.vue           # composes sections based on selection
│   │   └── sections/
│   │       ├── PositionSection.vue
│   │       ├── TransformSection.vue
│   │       ├── FillSection.vue
│   │       ├── StrokeSection.vue
│   │       ├── ShadowSection.vue
│   │       ├── BlurSection.vue
│   │       ├── OpacitySection.vue
│   │       ├── TextSection.vue
│   │       ├── PathSection.vue
│   │       ├── ImageSection.vue
│   │       ├── VideoSection.vue
│   │       ├── MaskSection.vue
│   │       ├── MotionPathSection.vue
│   │       └── ArtboardSettingsSection.vue
│   │
│   ├── timeline/
│   │   ├── TimelinePanel.vue
│   │   ├── TimelineControls.vue          # play/pause/loop/fps
│   │   ├── TimelineRuler.vue
│   │   ├── TimelinePlayhead.vue
│   │   ├── TimelineTrackList.vue
│   │   ├── TimelineTrackRow.vue
│   │   ├── TimelineKeyframe.vue
│   │   └── composables/useTimelineDrag.ts
│   │
│   ├── editor/
│   │   ├── SaveButton.vue               # shown when anonymous-local and dirty
│   │   ├── SaveStatusIndicator.vue      # cloud save status display
│   │   └── ConflictModal.vue            # concurrent-edit conflict resolution
│   │
│   ├── motion-paths/
│   │   └── MotionPathOverlay.vue
│   │
│   ├── export/
│   │   ├── ExportModal.vue
│   │   ├── ExportFormatPicker.vue
│   │   ├── ExportPreflight.vue
│   │   ├── ExportProgress.vue
│   │   └── options/  LottieOptions, PngOptions, GifOptions, Mp4Options, WebmOptions
│   │
│   ├── landing/
│   │   └── (marketing landing page — LandingView route at '/')
│   ├── auth/  dashboard/  account/  onboarding/  upgrade/  # cloud/auth features (see SUPABASE.md)
│
├── layout/
│   ├── EditorShell.vue                   # CSS grid: topbar / left / center / right / bottom
│   └── EditorTopbar.vue
│
├── views/
│   ├── EditorView.vue
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   ├── AccountView.vue
│   ├── AuthCallbackView.vue
│   ├── PasswordResetView.vue
│   ├── LandingView.vue
│   └── TrashView.vue
│
└── router/index.ts                       # '/' → Landing, '/app' → Editor, '/dashboard' → Dashboard, '/login' → Login, etc.
```

---

## 3. Type Definitions

Full source for the canonical types. Treat these as the contract.

### `types/element.ts`

```ts
export type ElementType =
  | 'rect' | 'ellipse' | 'line' | 'polygon' | 'star'
  | 'text' | 'path' | 'group' | 'image' | 'video'

export interface FillEntry {
  id: string
  visible: boolean
  type: 'solid' | 'linear' | 'radial' | 'none'
  color: string        // hex without #
  opacity: number      // 0-1
}

export interface StrokeEntry {
  id: string
  visible: boolean
  color: string
  width: number
  position: 'center' | 'inside' | 'outside'
  cap: 'butt' | 'round' | 'square'
  join: 'miter' | 'round' | 'bevel'
  dashArray: number[]
  dashOffset: number
}

export interface ShadowEntry {
  id: string
  visible: boolean
  color: string
  opacity: number
  x: number
  y: number
  blur: number
  spread: number
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'

export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  blendMode: BlendMode
  fills: FillEntry[]
  strokes: StrokeEntry[]
  shadows: ShadowEntry[]
  blur: number
  visible: boolean
  locked: boolean
  flipX: boolean
  flipY: boolean
  transformOrigin: { x: number; y: number }   // 0..1 normalized, default {0.5, 0.5}
  cropRect?: { x: number; y: number; width: number; height: number } | null
}

export interface RectElement extends BaseElement {
  type: 'rect'
  rx: number
  ry: number
  radiusTopLeft: number
  radiusTopRight: number
  radiusBottomRight: number
  radiusBottomLeft: number
  radiusLinked: boolean
}

export interface EllipseElement extends BaseElement { type: 'ellipse' }
export interface LineElement extends BaseElement { type: 'line' }

export interface PolygonElement extends BaseElement {
  type: 'polygon'
  sides: number
}

export interface StarElement extends BaseElement {
  type: 'star'
  starPoints: number
  innerRadius: number      // 0..1
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'top' | 'middle' | 'bottom'
  lineHeight: number
  letterSpacing: number
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textDecoration: 'none' | 'underline' | 'line-through'
}

export interface PathPoint {
  id: string
  x: number
  y: number
  handleIn: { x: number; y: number } | null
  handleOut: { x: number; y: number } | null
  type: 'corner' | 'smooth' | 'symmetric'
}

export interface PathElement extends BaseElement {
  type: 'path'
  points: PathPoint[]
  closed: boolean
  d: string
  fillRule: 'nonzero' | 'evenodd'
  isMotionPath?: boolean           // true for guide paths created by the motion-path tool; excluded from layers panel
}

export interface GroupElement extends BaseElement {
  type: 'group'
  childIds: string[]
  hasMask?: boolean
}

export interface ImageElement extends BaseElement {
  type: 'image'
  imageStorageId: string       // IndexedDB key
  imageFileName: string
  imageWidth: number
  imageHeight: number
  objectFit: 'contain' | 'cover' | 'fill'
}

export interface VideoElement extends BaseElement {
  type: 'video'
  videoStorageId: string       // IndexedDB key
  fileName: string
  duration: number
  naturalWidth: number
  naturalHeight: number
  trimStart: number
  trimEnd: number
  fit: 'cover' | 'contain' | 'fill'
  playbackRate: number
}

export type Element =
  | RectElement | EllipseElement | LineElement
  | PolygonElement | StarElement | TextElement
  | PathElement | GroupElement | ImageElement | VideoElement
```

### `types/track.ts`

```ts
import type { PathPoint } from './element'

export type EasingType =
  | 'linear'
  | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic'
  | 'ease-in-back' | 'ease-out-back' | 'ease-in-out-back'
  | 'ease-out-bounce' | 'ease-out-elastic'
  | `cubic-bezier(${number},${number},${number},${number})`
  | `steps(${number})`

export type KeyframeValue = number | string | PathPoint[]

export interface Keyframe {
  id: string
  frame: number
  value: KeyframeValue
  easing: EasingType
}

/**
 * String path into an Element. Examples:
 *   'x', 'y', 'opacity', 'rotation'
 *   'fills.0.color', 'fills.0.opacity'
 *   'strokes.0.width'
 *   'shadows.0.x', 'shadows.0.blur'
 *   'fontSize', 'letterSpacing'
 *   'rx', 'd', 'points'
 *   'transformOrigin.x'
 */
export type PropertyPath = string

export interface Track {
  id: string
  elementId: string
  property: PropertyPath
  keyframes: Keyframe[]      // sorted by frame ascending; invariant maintained on mutation
  enabled: boolean
}
```

### `types/artboard.ts`

```ts
export type ArtboardNavigationTrigger = 'on-complete' | 'on-click'

export interface Artboard {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  elementIds: string[]            // top-level element IDs in this artboard
  order: number
  fps: number
  totalFrames: number
  loop: boolean
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  canvasX: number                 // position on infinite canvas
  canvasY: number
}
```

### `types/project.ts`

```ts
import type { Element } from './element'
import type { Track } from './track'
import type { Artboard } from './artboard'
import type { MotionPath } from './motion-path'

export interface ProjectMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  thumbnail: string | null
}

export interface ProjectData {
  meta: ProjectMeta
  artboards: Artboard[]
  elements: Element[]             // ALL elements, flat
  tracks: Track[]                 // ALL tracks, flat
  motionPaths: MotionPath[]
  schemaVersion: number           // bump when shape changes — currently 3
}
```

### `types/motion-path.ts`, `types/tool.ts`

```ts
// motion-path.ts
import type { PathPoint } from './element'
export interface MotionPath {
  id: string
  elementId: string
  points: PathPoint[]
  loop: boolean
  startFrame: number
  endFrame: number
  rotateAlongPath: boolean
}

// tool.ts
export type ToolType =
  | 'select' | 'hand' | 'rect' | 'ellipse' | 'line'
  | 'polygon' | 'star' | 'text' | 'pen' | 'motion-path'

export interface ToolDefinition {
  id: ToolType
  label: string
  shortcut: string
  iconName: string
}
```

---

## 4. Core Domain

Pure TypeScript. No Vue imports. Unit-testable in isolation (you're skipping tests, but design for them).

### `core/animation/engine.ts`

```ts
import type { Element } from '@/types/element'
import type { Track } from '@/types/track'
import { computeTrackValueAt } from './tracks'
import { setValueAtPath } from '@/core/utils/valueAtPath'

/**
 * Pure function: given an element and its tracks, compute the element state at a specific frame.
 * Returns a NEW element (does not mutate input).
 */
export function computeElementAt(
  element: Element,
  tracks: Track[],
  frame: number
): Element {
  const elementTracks = tracks.filter(t => t.elementId === element.id && t.enabled)
  if (elementTracks.length === 0) return element

  // Structured clone is fine here — elements are JSON-safe
  const next = structuredClone(element) as Element

  for (const track of elementTracks) {
    if (track.keyframes.length === 0) continue
    const value = computeTrackValueAt(track, frame)
    if (value === undefined) continue
    setValueAtPath(next, track.property, value)
  }

  return next
}
```

### `core/animation/tracks.ts`

```ts
import type { Track, Keyframe, KeyframeValue } from '@/types/track'
import { interpolate } from './interpolate'
import { getEasingFn } from './easing'

/**
 * Compute the value of a track at the given frame.
 * Returns undefined if the track has no keyframes.
 */
export function computeTrackValueAt(track: Track, frame: number): KeyframeValue | undefined {
  const kfs = track.keyframes
  if (kfs.length === 0) return undefined
  if (frame <= kfs[0].frame) return kfs[0].value
  if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].value

  // Binary search would be nicer, but linear is fine for typical N
  let prev = kfs[0]
  let next = kfs[1]
  for (let i = 0; i < kfs.length - 1; i++) {
    if (kfs[i].frame <= frame && kfs[i + 1].frame >= frame) {
      prev = kfs[i]
      next = kfs[i + 1]
      break
    }
  }

  const span = next.frame - prev.frame
  if (span === 0) return prev.value

  const rawT = (frame - prev.frame) / span
  const t = getEasingFn(prev.easing)(rawT)
  return interpolate(prev.value, next.value, t, track.property)
}
```

### `core/animation/interpolate.ts`

Three interpolators: number, color (hex), path (per-point or numeric). The path interpolator must handle "structurally different" paths by snapping at t=0.5 (port the v1 implementation in `lib/engine/AnimationEngine.ts`).

The dispatcher uses the `PropertyPath` to decide:
- Property includes `'color'` (case-insensitive) → color interpolation
- Property === `'d'` → path string interpolation
- Property === `'points'` → point-array interpolation
- Otherwise → number

### `core/utils/valueAtPath.ts`

```ts
/**
 * Get a value from an object via a dot-separated path.
 *   getValueAtPath({ a: { b: [10, 20] } }, 'a.b.1') === 20
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let cur: any = obj
  for (const k of keys) {
    if (cur == null) return undefined
    cur = cur[k]
  }
  return cur
}

/**
 * Set a value into an object via a dot-separated path. Mutates `obj`.
 *   setValueAtPath({ fills: [{ color: 'fff' }] }, 'fills.0.color', '000')
 *     → { fills: [{ color: '000' }] }
 *
 * Numeric path segments index into arrays. Missing intermediate keys are NOT created.
 */
export function setValueAtPath(obj: unknown, path: string, value: unknown): void {
  const keys = path.split('.')
  let cur: any = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null) return
    cur = cur[keys[i]]
  }
  if (cur != null) cur[keys[keys.length - 1]] = value
}
```

### `core/persistence/ProjectRepository.ts`

```ts
import type { ProjectData, ProjectMeta } from '@/types/project'

export interface ProjectRepository {
  list(): Promise<ProjectMeta[]>
  load(id: string): Promise<ProjectData | null>
  save(id: string, data: ProjectData): Promise<void>
  delete(id: string): Promise<void>
}
```

### `core/persistence/LocalProjectRepo.ts`

Implements `ProjectRepository` against localStorage.
- Index key: `loopa.v2.projects.index` → `ProjectMeta[]`
- Per-project key: `loopa.v2.project.<id>` → `ProjectData`
- All methods return Promises (resolve immediately) so the interface stays uniform.

### `core/persistence/MediaRepository.ts` + `IDBMediaRepo.ts`

```ts
export interface MediaRepository {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | null>
  deleteMany(ids: string[]): Promise<void>
}
```

IndexedDB DB: `loopa.media`, store: `blobs`. Used for video and image element storage.

---

## 5. Stores

Full API surface for each store. Implement using composition-style `defineStore('id', () => {...})`.

### `useDocumentStore`

The persisted document. Mutations only.

```ts
interface DocumentState {
  projectId: string | null
  meta: ProjectMeta | null
  artboards: Artboard[]
  elements: Element[]
  tracks: Track[]
  motionPaths: MotionPath[]
}

// Getters
elementById(id): Element | undefined
elementsByIds(ids): Element[]
artboardById(id): Artboard | undefined
tracksForElement(elementId): Track[]
trackForProperty(elementId, property): Track | undefined
elementsForArtboard(artboardId): Element[]             // by artboard.elementIds
topLevelElementsForArtboard(artboardId): Element[]    // excludes group children
childToGroupMap: Map<string, string>                   // computed
elementToArtboardMap: Map<string, string>              // computed

// Actions — Project
loadProject(data: ProjectData): void
clearProject(): void
serialize(): ProjectData

// Actions — Artboard
addArtboard(name?, width?, height?): string            // returns id
updateArtboard(id, updates: Partial<Artboard>): void
deleteArtboard(id): void
duplicateArtboard(id): string
reorderArtboard(id, newIndex): void

// Actions — Element
addElement(element: Element, artboardId: string): void
updateElement(id, updates: Partial<Element>): void
deleteElements(ids: string[]): void                    // cascades: tracks, motion paths, group children
reorderElement(id, newIndex): void
duplicateElements(ids): string[]                       // returns new ids; copies tracks too
groupElements(ids): string | null
ungroupElements(groupId): string[]
moveElementsToArtboard(ids, artboardId): void

// Actions — Track
addTrack(track: Track): void                           // dedup by (elementId, property)
upsertKeyframe(elementId, property, frame, value, easing?): void
                                                       // creates track if missing
                                                       // replaces keyframe at same frame
deleteKeyframe(trackId, keyframeId): void              // deletes track if empty
deleteTracksForElement(elementId): void
setTrackEnabled(trackId, enabled): void

// Actions — MotionPath
addMotionPath(mp: MotionPath): void                    // one per element; replace if exists
updateMotionPath(id, updates): void
deleteMotionPath(id): void
```

**Important**: `updateElement(id, { x: ... })` for a group MUST propagate the delta to its children (port the v1 logic).

### `useSelectionStore`

```ts
interface SelectionState {
  selectedIds: Set<string>
  selectedKeyframeIds: Set<string>
  hoveredId: string | null
  activeArtboardId: string | null
  activeGroupId: string | null              // when "entered" a group
  editingPathId: string | null
  pathEditMode: boolean
}

// Actions
select(id): void                            // single
addToSelection(id): void
toggleSelection(id): void
selectMany(ids): void
clearSelection(): void
selectKeyframe(id, multi?): void
clearKeyframeSelection(): void
setHovered(id | null): void
setActiveArtboard(artboardId): void         // also clears selection
enterGroup(groupId): void
exitGroup(): void
enterPathEditMode(pathId): void
exitPathEditMode(): void
```

### `useViewportStore`

```ts
interface ViewportState {
  zoom: number                              // 0.05 .. 10
  panX: number
  panY: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number                          // default 10
  showRulers: boolean
  showGuides: boolean
  guides: Guide[]                           // persisted
  isPanning: boolean
  isTransforming: boolean                   // suppresses wheel zoom etc.
}

// Actions
setZoom(z): void
zoomIn(): void
zoomOut(): void
resetView(): void
fitToView(width, height, viewportEl): void
pan(dx, dy): void
toggleGrid(): void
toggleSnap(): void
toggleRulers(): void
toggleGuides(): void
addGuide(axis: 'h' | 'v', position): Guide
updateGuidePosition(id, position): void
removeGuide(id): void
toggleGuideLock(id): void
setTransforming(v: boolean): void
```

### `useToolStore`

```ts
interface ToolState {
  currentTool: ToolType
  toolOptions: Record<string, unknown>      // per-tool settings (e.g. polygon sides)
}

// Actions
setTool(t: ToolType): void                  // exits path-edit mode if leaving select
setToolOption<K, V>(toolId, key, value): void
```

### `useTimelineStore`

```ts
interface TimelineState {
  currentFrame: number
  totalFrames: number                       // mirrors active frame's totalFrames
  fps: number                               // mirrors active frame's fps
  isPlaying: boolean
  loop: boolean
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  playbackCompleteCount: number             // increments on each loop completion
}

// Getters
duration: number                            // totalFrames / fps
currentTime: string                         // 'M:SS.s'

// Actions
play(): void
pause(): void
stop(): void                                // pause + seek(0)
toggle(): void
seek(frame): void
nextFrame(): void
prevFrame(): void
setFps(fps): void
setTotalFrames(n): void
setLoop(b): void
setDirection(d): void
syncFromArtboard(artboard: Artboard): void  // call when activeArtboard changes
```

Playback uses `requestAnimationFrame` with elapsed-time math; do not increment by 1 per frame.

### `useHistoryStore`

```ts
interface HistorySnapshot {
  label: string
  data: ProjectData
  timestamp: number
}

interface HistoryState {
  past: HistorySnapshot[]                   // max 100
  future: HistorySnapshot[]
  currentTransaction: { label: string; baseline: ProjectData } | null
}

// Getters
canUndo: boolean
canRedo: boolean

// Actions
seed(): void                                // capture initial state on project load

transact(label: string, fn: () => void): void
// Captures pre-state, runs fn, captures post-state, pushes one snapshot.

beginTransaction(label: string): void
// Captures pre-state, holds it until commit/cancel.

commit(): void
// Captures post-state, pushes one snapshot. No-op if no transaction open.

cancel(): void
// Restores pre-state. Use for ESC during drag.

undo(): void
redo(): void
clear(): void
```

Snapshot strategy: clone `useDocumentStore.serialize()`. With ~100 snapshots and JSON-safe data, structuredClone is fine. Cap memory by capping snapshot count.

### `useClipboardStore`

```ts
interface ClipboardState {
  data: { elements: Element[]; tracks: Track[]; sourceProjectId: string; timestamp: number } | null
}

// Getters
hasPasteData: boolean

// Actions
copy(elementIds: string[]): void
paste(targetArtboardId: string): { elementIds: string[]; trackIds: string[] }
                                            // new IDs, position offset +20 if same project
clear(): void
```

Persisted to localStorage so paste survives refresh.

---

## 6. Composables

### `useAnimatedElement(elementId)` → `ComputedRef<Element | null>`

Reactive: returns the element with track values applied at `timeline.currentFrame`. Memoize internally if needed; this is read by every shape on every frame change.

### `useAnimatedProperty(elementId, propertyPath)` → bidirectional binding

```ts
function useAnimatedProperty<T>(
  elementId: Ref<string>,
  propertyPath: Ref<PropertyPath>
): {
  value: WritableComputedRef<T>
  hasTrack: ComputedRef<boolean>
  hasKeyframeAtCurrentFrame: ComputedRef<boolean>
  toggleTrack(): void
  addKeyframeHere(): void
  deleteKeyframeHere(): void
}
```

`value.get()`: if track exists, return interpolated value at currentFrame; else return base element value.
`value.set(v)`: if track exists, upsert keyframe at currentFrame; else update element directly.

Every inspector field uses this. The "diamond" indicator next to a label is bound to `hasKeyframeAtCurrentFrame`.

### `usePointer(viewportEl)` → screen↔svg conversion + drag helper

```ts
function usePointer(viewportEl: Ref<HTMLElement | null>) {
  return {
    screenToSvg(clientX, clientY): { x: number; y: number }
    svgToScreen(x, y): { x: number; y: number }
    startDrag(e: PointerEvent, opts: {
      onMove(e: PointerEvent, delta: { dx: number; dy: number }): void
      onEnd(e: PointerEvent): void
      cursor?: string
    }): void
  }
}
```

`startDrag` uses pointer capture. No `addEventListener` boilerplate at the call site.

---

## 7. UI Primitives

Every primitive uses Tailwind utilities directly. No `<style scoped>`. Use `cn()` for conditional classes.

### `ui/Button.vue`

```ts
defineProps<{
  variant?: 'default' | 'accent' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  active?: boolean
  disabled?: boolean
}>()
```

Class composition (use `cn()`):
- Base: `inline-flex items-center justify-center gap-1 px-2 border border-border rounded-sm text-xs font-medium whitespace-nowrap transition-colors`
- Default: `bg-bg-3 text-text-2 hover:bg-bg-5 hover:text-text-1 hover:border-border-l`
- Active: `bg-accent-soft text-accent border-accent`
- Accent: `bg-accent text-white border-accent hover:bg-accent-h`
- Ghost: `border-transparent bg-transparent hover:bg-bg-4 hover:border-transparent`
- Danger: `text-danger hover:bg-danger-soft hover:border-danger`
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`
- Sizes: md → `h-input` (default), sm → `h-[1.5rem] px-[7px]`, xs → `h-[1.25rem] px-[5px] text-[10px]`

### `ui/IconButton.vue`

Same as Button but square. Width matches height per size. No padding text.

### `ui/NumberField.vue`

```ts
defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  precision?: number       // decimal places
  paired?: boolean         // smaller width for X/Y pairs
  disabled?: boolean
  unit?: string            // shown as suffix (e.g. '°', 'px')
}>()
defineEmits<{ 'update:modelValue': [number] }>()
```

Behavior:
- Drag on the field (when not focused) to scrub the value. Hold Shift for ×10, Alt for ×0.1.
- Arrow up/down: ±step. Shift+arrow: ±step×10.
- On blur, parse value and clamp to min/max.
- Show unit suffix non-interactively at the right edge.

Classes:
- `flex-1 min-w-0 h-input bg-bg-3 border border-border rounded-sm px-[7px] font-mono text-xs text-text-1 outline-none transition-colors focus:border-accent disabled:opacity-40 cursor-ew-resize focus:cursor-text`
- When `paired`: replace `flex-1` with `w-[4.75rem]`

### `ui/TextField.vue`

Same wrapper, no scrub, no mono font.

### `ui/Select.vue`

Same wrapper as NumberField, with chevron via background-image (port from v1) and `appearance-none cursor-pointer`. Use a real `<select>` for accessibility.

### `ui/ColorField.vue`

```ts
defineProps<{
  modelValue: string       // hex without #
  alpha?: number           // 0..1, optional
}>()
```

Layout: combined field with shared border, swatch (h-input × h-input) + hex input. Click swatch opens `<Popover>` with a color picker (build a minimal one or defer to phase 7 polish).

### `ui/Slider.vue`, `ui/Toggle.vue`, `ui/Checkbox.vue`

Build minimal versions matching the v1 visual:
- Toggle: 28×16 pill, `bg-bg-4` off / `bg-accent` on, 12px circle thumb that translates 12px on toggle.
- Slider: track 4px high, thumb 12px circle, accent-colored fill.
- Checkbox: 14×14 square, `bg-bg-3 border border-border` off, `bg-accent border-accent` on with check SVG.

### `ui/Modal.vue`

Teleport to body, backdrop with `bg-black/60 backdrop-blur-sm`, content card with `bg-bg-2 border border-border-l rounded-lg`. Esc and click-outside both emit `close`. Use Vue 3 `<Transition>` for fade.

### `ui/Tooltip.vue`, `ui/Popover.vue`

Build minimal floating-element versions. Use CSS `position: fixed` with computed coordinates from a target ref. Keep them dependency-free.

### `ui/ContextMenu.vue`

```ts
interface ContextMenuItem {
  label: string
  shortcut?: string
  action(): void
  separator?: boolean
  danger?: boolean
  disabled?: boolean
}

defineProps<{
  show: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}>()
defineEmits<{ close: [] }>()
```

Uses `<Teleport to="body">`. Auto-flips if it would overflow the viewport.

### `ui/ResizablePanel.vue`

```ts
defineProps<{
  side: 'left' | 'right' | 'bottom'
  min: number
  max: number
  defaultSize: number
  storageKey?: string      // persists size to localStorage if provided
}>()
```

Renders a slot wrapped in a div with `width` (or `height`) set, plus a 4px draggable splitter on the appropriate edge. Use `usePointer.startDrag`.

### `ui/inspector/Section.vue`, `inspector/Row.vue`, `inspector/Label.vue`, `inspector/CollapsibleSection.vue`, `inspector/PairedField.vue`

```vue
<!-- Section.vue -->
<template>
  <div class="px-3 py-2.5 border-b border-border">
    <div v-if="title" class="text-xs font-semibold text-text-2 mb-2">{{ title }}</div>
    <slot />
  </div>
</template>
```

```vue
<!-- Row.vue -->
<template>
  <div class="flex items-center gap-1.5 min-h-input mb-1.5 last:mb-0">
    <slot />
  </div>
</template>
```

```vue
<!-- Label.vue -->
<template>
  <span class="w-label min-w-label text-xs text-text-3 font-medium truncate select-none">
    <slot />
  </span>
</template>
```

`CollapsibleSection.vue`: extends Section with a clickable header that toggles a collapsed state (persist to localStorage by section title). Optional `hasActivity` prop renders a 4px diamond indicator next to the title (yellow when track has keyframes on the current element).

`PairedField.vue`: a horizontal flex container that places two `paired` NumberFields side-by-side with a small label between (e.g., "X" / "Y").

---

## 8. Tools

### `tools/_base/types.ts`

```ts
export interface CanvasContext {
  viewportEl: HTMLElement
  screenToSvg(x: number, y: number): { x: number; y: number }
  svgToScreen(x: number, y: number): { x: number; y: number }
  zoom: number
}

export interface ToolController {
  id: ToolType
  cursor?: string                              // CSS cursor or null
  onActivate?(ctx: CanvasContext): void
  onDeactivate?(ctx: CanvasContext): void
  onPointerDown?(e: PointerEvent, ctx: CanvasContext): void
  onPointerMove?(e: PointerEvent, ctx: CanvasContext): void
  onPointerUp?(e: PointerEvent, ctx: CanvasContext): void
  onDoubleClick?(e: PointerEvent, ctx: CanvasContext): void
  onKeyDown?(e: KeyboardEvent, ctx: CanvasContext): boolean   // return true if handled
  // Optional overlay component to render on the canvas while this tool is active
  overlay?: Component
}
```

### `tools/_base/toolRegistry.ts`

```ts
const registry = new Map<ToolType, ToolController>()
export function registerTool(id: ToolType, controller: ToolController): void
export function getToolController(id: ToolType): ToolController | undefined
```

Each tool file calls `registerTool(id, controller)` at module load. `src/tools/index.ts` imports all tools for their side effects; that file is imported once in `main.ts`.

### `tools/_base/ToolDispatcher.ts`

```ts
export function useToolDispatcher() {
  const tool = useToolStore()
  function dispatch(type: 'pointerdown'|'pointermove'|'pointerup'|'dblclick'|'keydown', e: Event, ctx: CanvasContext) {
    const controller = getTool(tool.currentTool)
    if (!controller) return
    // forward to appropriate handler
  }
  return { dispatch }
}
```

### Example: `tools/rect/RectTool.ts`

```ts
import { registerTool } from '../_base/toolRegistry'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useToolStore } from '@/stores/useToolStore'
import { createDefaultElement } from '@/core/elements/factory'
import type { RectElement } from '@/types/element'
import type { ToolController, CanvasContext } from '../_base/types'

let dragStart: { x: number; y: number } | null = null
let createdId: string | null = null

const rectTool: ToolController = {
  id: 'rect',
  cursor: 'crosshair',

  onPointerDown(e, ctx) {
    const doc = useDocumentStore()
    const sel = useSelectionStore()
    const history = useHistoryStore()
    const pos = ctx.screenToSvg(e.clientX, e.clientY)
    dragStart = pos

    history.beginTransaction('Draw rectangle')
    const el = createDefaultElement('rect') as RectElement
    el.x = pos.x; el.y = pos.y; el.width = 1; el.height = 1
    doc.addElement(el, sel.activeArtboardId!)
    createdId = el.id
    sel.select(el.id)
  },

  onPointerMove(e, ctx) {
    if (!dragStart || !createdId) return
    const pos = ctx.screenToSvg(e.clientX, e.clientY)
    const x = Math.min(dragStart.x, pos.x)
    const y = Math.min(dragStart.y, pos.y)
    const width = Math.abs(pos.x - dragStart.x)
    const height = Math.abs(pos.y - dragStart.y)
    useDocumentStore().updateElement(createdId, { x, y, width, height })
  },

  onPointerUp() {
    const tool = useToolStore()
    const doc = useDocumentStore()
    const sel = useSelectionStore()
    const history = useHistoryStore()
    if (createdId) {
      const el = doc.elementById(createdId)
      // Drop tiny accidental clicks
      if (!el || el.width < 2 || el.height < 2) {
        doc.deleteElements([createdId])
        sel.clearSelection()
        history.cancel()
      } else {
        history.commit()
      }
    }
    dragStart = null
    createdId = null
    tool.setTool('select')                     // auto-revert to select after drawing
  }
}

registerTool(rectTool)
export default rectTool
```

Other draw tools follow the same shape. Pen and motion-path tools have multi-click flows (handled inside their controller state).

---

## 9. Features

### `features/canvas/EditorCanvas.vue` (~150 lines target)

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useViewportStore } from '@/stores/useViewportStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useCanvasViewport } from './composables/useCanvasViewport'
import { useCanvasInteractions } from './composables/useCanvasInteractions'
import CanvasArtboardsLayer from './layers/CanvasArtboardsLayer.vue'
import OverlayLayer from './layers/OverlayLayer.vue'
import SelectionLayer from './layers/SelectionLayer.vue'

const viewportEl = useTemplateRef('viewportEl')
const viewport = useCanvasViewport(viewportEl)
const interactions = useCanvasInteractions(viewportEl, viewport)
const view = useViewportStore()
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-bg-1" @wheel.prevent="viewport.onWheel">
    <div
      ref="viewportEl"
      class="absolute inset-0"
      :style="{ cursor: interactions.cursor.value }"
      @pointerdown="interactions.onPointerDown"
      @pointermove="interactions.onPointerMove"
      @pointerup="interactions.onPointerUp"
      @dblclick="interactions.onDoubleClick"
      @contextmenu.prevent="interactions.onContextMenu"
    >
      <svg
        :viewBox="viewport.viewBox.value"
        xmlns="http://www.w3.org/2000/svg"
        class="absolute inset-0 h-full w-full"
      >
        <CanvasArtboardsLayer />
        <OverlayLayer />
        <SelectionLayer />
      </svg>
    </div>
  </div>
</template>
```

Note: there is no provide/inject. Children import stores directly.

### `features/canvas/composables/useCanvasInteractions.ts`

The thin layer that converts DOM pointer events into `ToolDispatcher` calls. Owns:
- The current cursor (from active tool or fallback)
- Forwarding pointerdown/move/up/dblclick to dispatcher
- Background-vs-element detection (so tool dispatch only fires on background)

When a pointer event hits an element (via `.target` walk-up), the canvas does NOT call the tool — instead it triggers `useElementTransform.startDrag(e, id)` for select tool, or lets the event bubble for other tools.

### `features/canvas/composables/useElementTransform.ts`

One composable for drag, resize, rotate, all unified. Returns:
```ts
{
  startDrag(e: PointerEvent, id: string): void
  startResize(e: PointerEvent, handle: ResizeHandle): void
  startRotate(e: PointerEvent): void
  isTransforming: ComputedRef<boolean>
}
```

Each method opens `history.beginTransaction()`, runs pointer capture, and commits on pointerup. Cancel on Escape via `history.cancel()` and reverting state.

### `features/canvas/ElementRenderer.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedElement } from '@/composables/useAnimatedElement'
import RectShape from './shapes/RectShape.vue'
import EllipseShape from './shapes/EllipseShape.vue'
// ... other shape imports

const props = defineProps<{ elementId: string }>()
const element = useAnimatedElement(() => props.elementId)

const ShapeComponent = computed(() => {
  if (!element.value) return null
  switch (element.value.type) {
    case 'rect': return RectShape
    case 'ellipse': return EllipseShape
    // ...
  }
})
</script>

<template>
  <component v-if="element && ShapeComponent" :is="ShapeComponent" :element="element" />
</template>
```

Each `XxxShape.vue` gets a clean, fully-resolved Element (animated values applied) and renders the appropriate SVG. No animation logic in shapes. No type assertions.

### `features/properties/PropertiesPanel.vue`

Reads selection, decides which sections to render. Each section is independent.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useSelectionStore } from '@/stores/useSelectionStore'
import { useDocumentStore } from '@/stores/useDocumentStore'
import { useAnimatedElement } from '@/composables/useAnimatedElement'
import PanelHeader from '@/ui/PanelHeader.vue'
// ... section imports

const sel = useSelectionStore()
const doc = useDocumentStore()

const isSingle = computed(() => sel.selectedIds.size === 1)
const isMulti = computed(() => sel.selectedIds.size > 1)
const selectedId = computed(() => isSingle.value ? [...sel.selectedIds][0] : null)
const element = useAnimatedElement(() => selectedId.value ?? '')
const type = computed(() => element.value?.type)
</script>

<template>
  <div class="flex h-full flex-col bg-bg-2 border-l border-border">
    <PanelHeader>Properties</PanelHeader>
    <div class="flex-1 overflow-y-auto">
      <template v-if="isSingle && element">
        <PositionSection :id="selectedId!" />
        <TransformSection :id="selectedId!" />
        <FillSection :id="selectedId!" />
        <StrokeSection :id="selectedId!" />
        <ShadowSection :id="selectedId!" />
        <BlurSection :id="selectedId!" />
        <OpacitySection :id="selectedId!" />
        <TextSection v-if="type === 'text'" :id="selectedId!" />
        <PathSection v-if="type === 'path'" :id="selectedId!" />
        <ImageSection v-if="type === 'image'" :id="selectedId!" />
        <VideoSection v-if="type === 'video'" :id="selectedId!" />
        <MaskSection v-if="type === 'group'" :id="selectedId!" />
        <MotionPathSection :id="selectedId!" />
      </template>
      <template v-else-if="isMulti">
        <!-- alignment, multi-edit -->
      </template>
      <template v-else>
        <ArtboardSettingsSection />
      </template>
    </div>
  </div>
</template>
```

### Example section: `PositionSection.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Section from '@/ui/inspector/Section.vue'
import Row from '@/ui/inspector/Row.vue'
import Label from '@/ui/inspector/Label.vue'
import NumberField from '@/ui/NumberField.vue'
import { useAnimatedProperty } from '@/composables/useAnimatedProperty'

const props = defineProps<{ id: string }>()
const idRef = ref(props.id)
const x = useAnimatedProperty<number>(idRef, ref('x'))
const y = useAnimatedProperty<number>(idRef, ref('y'))
</script>

<template>
  <Section title="Position">
    <Row>
      <Label>X</Label>
      <NumberField v-model="x.value.value" precision="0" />
    </Row>
    <Row>
      <Label>Y</Label>
      <NumberField v-model="y.value.value" precision="0" />
    </Row>
  </Section>
</template>
```

That's a full inspector section — 17 lines of script + template. Visual fidelity to v1 is automatic because the primitives encode it.

---

## 10. Build Phases

Each phase is a complete, runnable increment. Don't move on until "done when" is met.

### Phase 1 — Foundation ✅

**Tasks**
- `pnpm create vite@latest loopa-v2 --template vue-ts`
- Install: `pinia vue-router` and dev `tailwindcss@next @tailwindcss/vite eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- Create `src/assets/styles/main.css` (use the provided `main.css`)
- Wire Tailwind v4 in `vite.config.ts` via `@tailwindcss/vite` plugin
- Configure `tsconfig.app.json` with `paths: { "@/*": ["src/*"] }` and strict mode
- Set up `eslint.config.ts` and `.prettierrc`
- Create empty `EditorView.vue`, route `/`
- Verify: `pnpm dev` shows the dark `bg-bg-0` background, "Editor" placeholder text in `text-text-1`

**Done when**: dev server runs, Tailwind classes like `bg-bg-2 text-text-1 font-sans` resolve to your tokens.

### Phase 2 — Types and core domain ✅

**Tasks**
- Create all files in `src/types/`
- Create all files in `src/core/utils/` (id, math, color, valueAtPath, cn, deepClone)
- Create `src/core/animation/` (easing.ts: port v1, interpolate.ts, tracks.ts, engine.ts)
- Create `src/core/elements/factory.ts` and `bounds.ts`
- Create `src/core/path/builder.ts` and `motionPathMath.ts`
- Create `src/core/persistence/ProjectRepository.ts` interface, `LocalProjectRepo.ts` impl, `MediaRepository.ts` interface, `IDBMediaRepo.ts` impl

**Done when**: `pnpm build` succeeds. No imports of Vue inside `core/` (verify via grep).

### Phase 3 — Stores ✅

**Tasks**
- Create all 7 Pinia stores per the contracts in §5
- `main.ts`: `app.use(createPinia())`
- `useDocumentStore` calls `LocalProjectRepo` for persistence; never touches localStorage directly
- `useHistoryStore.transact()` works end-to-end (snapshot before, run fn, snapshot after, push entry)

**Done when**: in DevTools console, you can:
```js
const doc = useDocumentStore()
const history = useHistoryStore()
doc.loadProject(/* test data */)
history.transact('test', () => doc.addElement(/* ... */))
history.undo()    // element disappears
history.redo()    // element returns
```

### Phase 4 — UI primitives ✅

**Tasks**
- Build every component in `src/ui/` per §7
- Build all inspector primitives in `src/ui/inspector/`
- Create `~50` icon components in `src/ui/icons/` (port from v1)
- Build a `/_dev` route (only in development) that renders every primitive in every state — buttons (4 variants × 3 sizes × 3 states), all field types, modal, popover, tooltip, context menu, resizable panel
- Visual QA against v1 prototype side-by-side

**Done when**: `/_dev` looks identical to the equivalent surfaces in the v1 prototype. Any pixel-level deviation gets fixed before moving on.

> **Note (post-ship)**: Several UI primitives were removed as dead code after phases completed. No longer in `src/ui/`: `TextField.vue`, `Slider.vue`, `Checkbox.vue`, `Tooltip.vue`, `Popover.vue`, `ConfirmDialog.vue`, `EmptyState.vue`. Removed from `src/ui/inspector/`: `Section.vue` (replaced by `CollapsibleSection.vue` used everywhere), `PairedField.vue`. Do not re-create these unless they are actually needed.

### Phase 5 — Editor shell ✅

**Tasks**
- `EditorTopbar.vue`: project name, undo/redo, play, save state. Pure presentational, wires to stores.
- `EditorShell.vue`: CSS grid layout
  ```
  grid-template-rows: var(--spacing-topbar) 1fr;
  grid-template-columns: auto 1fr auto;
  ```
- Place `<ResizablePanel side="left">` (Layers — empty placeholder), center column with `<ResizablePanel side="bottom">` (Timeline — empty placeholder), `<ResizablePanel side="right">` (Properties — empty placeholder)
- `EditorView.vue` mounts `EditorShell`

**Done when**: app looks like Loopa with empty regions, panels resize, layout is pixel-accurate.

### Phase 6 — Canvas + basic tools ✅

**Tasks**
- `useCanvasViewport.ts`: pan, zoom, screenToSvg, fitToView
- `EditorCanvas.vue` + 3 layer components per §9
- `ElementRenderer.vue` + all 8 shape components (skip image/video for now — add empty stubs)
- All draw tools: select, hand, rect, ellipse, line, polygon, star, text
- `tools/_base/ToolDispatcher.ts` and `useCanvasInteractions.ts`
- `useElementTransform.ts`: drag, resize, rotate
- `SelectionOverlay` rendered above elements with handles
- `MarqueeOverlay` for marquee selection
- All mutations through `history.transact` / `beginTransaction`

**Done when**: you can switch tools from the toolbar (or via shortcut), draw rectangles/ellipses/text on a single hardcoded frame, select them, drag them, resize them, rotate them, undo/redo all of it.

### Phase 7 — Layers + Properties (static, no animation) ✅

**Tasks**
- `LayersPanel.vue` with `ArtboardRow`, `ElementRow`. Single hardcoded artboard is fine for now.
- All properties sections except `MotionPathSection`:
  - PositionSection, TransformSection, FillSection, StrokeSection, ShadowSection, BlurSection, OpacitySection
  - TextSection (when text), PathSection (when path), MaskSection (when group)
- Sections use `useAnimatedProperty` even though no tracks exist yet — the composable falls back to direct element updates
- Inspector edits flow through `history.transact`

**Done when**: full edit loop works — select element, change fill color, undo/redo, see layer panel update in sync.

### Phase 8 — Timeline + animation ✅

**Tasks**
- `TimelinePanel.vue` with controls, ruler, playhead, track list
- `useTimelineDrag.ts` for scrubbing and keyframe dragging
- One `TimelineTrackRow` per Track in the document; one keyframe diamond per Keyframe
- Click "diamond" in inspector field → `useAnimatedProperty.toggleTrack()` creates a track and adds a keyframe at currentFrame
- Editing a property value when a track exists updates/adds a keyframe at currentFrame instead of the base element
- Playback uses `requestAnimationFrame` + elapsed-time math, advances `currentFrame`
- All shape renderers automatically reflect animated values via `useAnimatedElement`

**Done when**: you can animate a rectangle's position from frame 0 to frame 30, scrub, play, loop, and undo/redo every action.

---

### Phase 9 — Artboards system ✅

**Tasks**
- Multiple artboards on infinite canvas, positioned at `artboard.canvasX/Y`
- Artboard switching from layers panel; click an inactive artboard in the canvas activates it
- Artboard settings section (width, height, fps, totalFrames, loop, direction, background color)
- Active artboard outline accent; inactive artboards dimmed via SVG mask
- Per-artboard timeline sync (`useTimelineStore.syncFromArtboard`)

**Done when**: you can create multiple artboards, switch between them, each with its own animation playback.

### Phase 10 — Pen tool + path editing ✅

**Tasks**
- `tools/pen/PenTool.ts` with multi-click path creation, ESC/Enter to commit
- `PenOverlay.vue` shows in-progress segments
- Path edit mode: double-click a path enters edit mode, shows `PathPointHandles`
- `tools/path-edit/PathEditTool.ts` for moving/adding/deleting points and bezier handles
- `PathSection` inspector: closed toggle, fill rule, point operations

**Done when**: draw a path with curves, double-click to edit, drag points and handles, animate the `points` track.

### Phase 11 — Components system: CANCELLED

> Removed from scope. See git history for the full implementation that was built and reverted.
> Rationale: hybrid animation model (shareAnimation), style propagation, and the master/instance
> data model added meaningful complexity across the type system, store, animation engine, and UI
> without sufficient return on investment for v2. The component fields (componentId,
> componentInstanceId, shareStyle, shareAnimation) have been removed from BaseElement.
> schemaVersion bumped to 3 on removal.

### Phase 12 — Masks ✅

**Tasks**
- "Use as Mask" context menu item on multi-selection: groups them, sets `hasMask: true`, first child becomes the mask shape
- Mask group renders children clipped by first child via SVG `<clipPath>`
- Releasing mask: ungroups, restores normal rendering
- `MaskSection` inspector for mask groups

**Done when**: select an ellipse + image, "Use as Mask," image is clipped to the ellipse shape.

### Phase 13 — Motion paths ✅

**Tasks**
- `tools/motion-path/MotionPathTool.ts`: click an element first, then draw the path
- `MotionPathOverlay.vue`: renders the path with start/end markers
- Element follows the motion path between `startFrame` and `endFrame`
- `core/path/motionPathMath.ts` already ported in phase 2 — wire it into `useAnimatedElement` (motion path overrides x/y/optionally rotation)
- `MotionPathSection` inspector: edit start/end frame, loop, rotate-along-path; delete the motion path

**Done when**: animate a circle along a curved bezier path with rotation following the tangent.

### Phase 14 — Image + Video elements ✅

**Tasks**
- "Add Image" and "Add Video" modals: file picker, drag-and-drop. Save blob via `IDBMediaRepo.put`.
- `ImageShape.vue` and `VideoShape.vue`: load blob URL from IDB, render `<image>` / `<foreignObject><video>`
- Drop image directly on canvas → creates ImageElement
- `ImageSection` (object-fit), `VideoSection` (trim, playback rate, fit)
- Cleanup: `deleteElements` calls `IDBMediaRepo.deleteMany` for affected blobs

**Done when**: drag an image into the canvas, it appears, can be transformed, animated, and deleting it cleans up its IndexedDB entry.

### Phase 15 — Polish ✅

**Tasks**
- `useShortcuts.ts` global keymap (port from v1, simplified):
  - V/H/R/E/L/P/T/N for tools, Cmd+Z/Y, Cmd+D/G, Cmd+C/V/X, Delete, Arrow nudge, Space+drag pan, +/- zoom, Esc to cancel
- Context menu on canvas (use `ui/ContextMenu`)
- Autosave via `useAutosave.ts`: debounced 2s after last document change
- Project Settings modal (rename project, etc.)
- Shortcuts modal (Cmd+/)
- Onboarding empty state when no elements
- Visual QA pass: every screen compared to v1 prototype

**Done when**: the editor feels finished. No console warnings. No `as any` in the codebase. No file over 400 lines.

### Phase 16 — Export system ✅ (out-of-plan)

> Implemented after Phase 15 as a block. See `EXPORT.md` for the full specification and phase-by-phase breakdown (E1–E5).

All five export sub-phases shipped together:
- **E1**: Export modal shell, job state machine (`useExportStore`), preflight UI
- **E2**: Lottie exporter (`core/export/lottie/`) with easing baking, motion path baking, mask support
- **E3**: SVG render primitive (`core/export/render/`) + `useThumbnail` composable
- **E4**: Raster pipeline in a Web Worker — PNG sequence (fflate) + GIF (gifenc, not gif.js)
- **E5**: WebCodecs video encoding — MP4 (H.264 via mp4-muxer) + WebM (VP9 via webm-muxer)

Additional work outside spec: `OffscreenCanvas.transferToImageBitmap()` was found to throw `InvalidStateError` in some Chrome versions; `composeFrame.ts` was rewritten to use `createImageBitmap` directly.

---

## Reference: file size budgets (red-flag thresholds)

| File | Target | Hard ceiling |
|------|--------|--------------|
| `EditorCanvas.vue` | ~150 | 250 |
| `useDocumentStore.ts` | ~300 | 400 |
| Any other store | ~100 | 200 |
| Any tool controller | ~100 | 200 |
| Any inspector section | ~50 | 120 |
| Any UI primitive | ~50 | 120 |
| Any shape component | ~80 | 150 |
| Any composable | ~80 | 200 |

If a file blows its ceiling, **stop and split it**. Don't ship it and "refactor later."

---

## How to use this document with Claude Code

The recommended flow:

1. Drop `CLAUDE.md`, `REBUILD.md`, and `main.css` into a fresh repo.
2. Run `claude` in the project root.
3. First message: *"Read CLAUDE.md and REBUILD.md. Start Phase 1. Stop after each phase and tell me it's complete with the 'done when' checklist verified."*
4. Review each phase's output before unblocking the next. Don't let it run all 15 phases unsupervised.
5. When a phase is done, commit. The phase boundaries are the right granularity for git history.
