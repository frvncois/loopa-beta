# EXPORT.md — Loopa export system

**Read CLAUDE.md first.** This document assumes you've internalized the conventions in CLAUDE.md and the architecture rationale in REBUILD.md. It specifies the export pipeline: types, file layout, phases, and per-format mapping rules.

Each phase ends in something runnable. Don't move on until the "done when" criteria are met. Commit at phase boundaries.

---

## Table of Contents

1. [Scope and non-goals](#1-scope-and-non-goals)
2. [Architecture](#2-architecture)
3. [Type definitions](#3-type-definitions)
4. [UI patterns](#4-ui-patterns)
5. [Phase E1 — Export shell + preflight system](#phase-e1)
6. [Phase E2 — Lottie exporter](#phase-e2)
7. [Phase E3 — Render primitive](#phase-e3)
8. [Phase E4 — Raster pipeline + PNG sequence + GIF](#phase-e4)
9. [Phase E5 — MP4 + WebM via WebCodecs](#phase-e5)
10. [Format reference: Lottie property + easing mappings](#format-reference)

---

## 1. Scope and non-goals

### In scope
- Lottie (`.json`) — vector animation data, the headline format
- PNG sequence (`.zip` of frames)
- GIF (`.gif`)
- MP4 (`.mp4`, H.264, no audio in v1)
- WebM (`.webm`, VP9, no audio in v1)
- Per-frame export (user picks one frame from the multi-frame project)
- Preflight system: warnings before export starts, never silent fallback

### Out of scope (do NOT add)
- SVG+CSS export — explicitly cut from the roadmap
- Audio mux for MP4/WebM — v2 follow-up
- Server-side / headless / batch export
- Export history, re-download, share links
- Export presets / saved configurations
- AI-anything

### What "fidelity" means here
The user has chosen **playback fidelity over editability** for Lottie. When source easing or features can't be represented natively in the target format, **bake** rather than approximate. A baked Lottie file plays correctly even if it can't be round-tripped back into Loopa.

---

## 2. Architecture

### Layer placement

Export logic respects the existing layer rule: `views ← features ← (ui, tools, composables, stores) ← core ← types`.

```
src/
├── types/
│   ├── export.ts                      # ExportFormat, ExportJob, RenderedFrame, MediaLayer, PreflightReport, ...
│   └── shims/gifenc.d.ts              # Hand-written type shim for gifenc
│
├── core/
│   └── export/
│       ├── imageData.ts               # gatherImageData(), blobToDataUri() — shared utility
│       ├── lottie/                    # Phase E2
│       │   ├── index.ts               # Public: buildLottie(), preflightLottie()
│       │   ├── buildLottie.ts
│       │   ├── easing.ts              # Loopa easing → Lottie bezier
│       │   ├── types.ts               # Internal Lottie type definitions
│       │   ├── elements/              # One mapper per ElementType
│       │   │   ├── rect.ts
│       │   │   ├── ellipse.ts
│       │   │   ├── line.ts
│       │   │   ├── polygon.ts
│       │   │   ├── star.ts
│       │   │   ├── path.ts
│       │   │   ├── text.ts
│       │   │   ├── group.ts
│       │   │   ├── image.ts
│       │   │   └── shared.ts          # Common transform/fill/stroke helpers
│       │   ├── tracks.ts              # Track → Lottie animatable property
│       │   └── preflight.ts
│       ├── render/                    # Phase E3
│       │   ├── renderProjectAtFrame.ts
│       │   └── svgBuilder.ts          # Pure SVG-string builder per element type
│       └── raster/                    # Phase E4 + E5
│           ├── composeFrame.ts        # SVG → ImageBitmap via createImageBitmap (no OffscreenCanvas)
│           ├── renderJob.ts           # Async generator: yields ImageBitmap per frame
│           ├── png.ts                 # buildPngSequence → ZIP via fflate
│           ├── gif.ts                 # buildGif → GIF via gifenc
│           └── video.ts               # buildMp4 + buildWebm via WebCodecs + mp4-muxer/webm-muxer
│
├── stores/
│   └── useExportStore.ts              # Job state machine (idle → preflighting → exporting → done | error)
│
├── composables/
│   ├── useExport.ts                   # Orchestration: load media blobs, call preflight, run job, handle download
│   ├── useExportWorker.ts             # Worker lifecycle wrapper: runRasterExport() → Promise<Blob>
│   └── useThumbnail.ts                # generateThumbnail(frameId) → data URI
│
├── workers/
│   └── exportWorker.ts                # Receives WorkerInput, posts WorkerOutput messages
│
└── features/
    └── export/
        ├── ExportModal.vue            # Container
        ├── ExportFormatPicker.vue     # Format selection + per-format options
        ├── ExportPreflight.vue        # Warnings list with severity styling
        ├── ExportProgress.vue         # Frame N of M, progress bar, cancel
        └── options/                   # Per-format options sub-panels
            ├── LottieOptions.vue
            ├── PngOptions.vue
            ├── GifOptions.vue
            ├── Mp4Options.vue
            └── WebmOptions.vue
```

### Hard architectural rules for export

These extend CLAUDE.md's rules, scoped to the export system:

1. **`core/export/` is pure.** No Vue, no Pinia, no DOM access. Render primitive returns SVG **strings**, never DOM nodes. Raster pipeline runs in a Web Worker.
2. **Each exporter is a self-contained module.** Public API: `build<Format>(input) → Promise<Blob>` and `preflight<Format>(input) → PreflightReport`. Nothing else escapes.
3. **Raster export runs in a Web Worker.** Main-thread rasterization will lock the tab on a 600-frame export. Spin up the worker in `useExport.ts`, transfer frames as needed.
4. **The render primitive is shared.** PNG, GIF, MP4, WebM, and the dashboard thumbnail generator all consume `renderProjectAtFrame`. Lottie does NOT touch it — Lottie is pure data-walk.
5. **Preflight is composable.** The shell calls every format's preflight and merges results. Severity is taxonomized (see below). Never inline warning rendering inside a format module.
6. **No new event bus.** Worker ↔ main communicates via the standard `postMessage` API wrapped in a single typed channel.
7. **Use existing UI primitives.** `Modal`, `Button`, `Select`, `NumberField`, `Toggle`, `IconButton` already exist. Do NOT hand-roll them. Do NOT introduce new design tokens — every color/spacing must come from `@theme` in `main.css`.

### Where the Export button lives

Add to `EditorTopbar.vue`, right side, before the Settings icon button. Use `Button` (not `IconButton`) — variant `primary`, label `"Export"`. Opens `ExportModal` via `useEditorModals`.

Add `_showExport = ref(false)` to `useEditorModals.ts` and expose `showExport`.

---

## 3. Type definitions

Place in `src/types/export.ts`. Pure types — no value imports.

```ts
// ── Format identity ──────────────────────────────────────────────────────────

export type ExportFormat = 'lottie' | 'png-sequence' | 'gif' | 'mp4' | 'webm'

// ── Per-format options ───────────────────────────────────────────────────────

export interface LottieOptions {
  format: 'lottie'
  prettyPrint: boolean              // default false
}

export interface PngSequenceOptions {
  format: 'png-sequence'
  scale: number                     // 1 | 2 | 3
}

export interface GifOptions {
  format: 'gif'
  scale: number                     // 1 | 2
  quality: 'low' | 'medium' | 'high'
}

export interface Mp4Options {
  format: 'mp4'
  scale: number                     // 1 | 2
  bitrate: number                   // kbps, default 5000
}

export interface WebmOptions {
  format: 'webm'
  scale: number
  bitrate: number
}

export type ExportOptions =
  | LottieOptions
  | PngSequenceOptions
  | GifOptions
  | Mp4Options
  | WebmOptions

// ── Preflight ────────────────────────────────────────────────────────────────

export type PreflightSeverity =
  | 'error'                         // Hard fail — export will not run
  | 'warning'                       // Feature dropped or approximated; export proceeds
  | 'info'                          // Informational only

export interface PreflightIssue {
  severity: PreflightSeverity
  code: string                      // 'video-unsupported' | 'easing-baked' | 'no-keyframes' | ...
  message: string                   // Human-readable, present-tense
  elementId?: string                // If issue is element-scoped
  elementName?: string              // For display
}

export interface PreflightReport {
  format: ExportFormat
  issues: PreflightIssue[]
  canExport: boolean                // false when ANY error exists
}

// ── Job state ────────────────────────────────────────────────────────────────

export type ExportJobStatus =
  | 'idle'
  | 'preflighting'
  | 'ready'                         // Preflight done, awaiting user confirm
  | 'exporting'
  | 'done'
  | 'error'
  | 'cancelled'

export interface ExportJob {
  id: string
  format: ExportFormat
  options: ExportOptions
  artboardId: string                // Which artboard is being exported
  status: ExportJobStatus
  preflight: PreflightReport | null
  progress: number                  // 0..1
  currentFrame: number              // For progress UI
  totalFrames: number
  error: string | null
  result: Blob | null
  resultFileName: string | null
}

// ── Render primitive output ──────────────────────────────────────────────────

export interface MediaLayer {
  type: 'video'
  elementId: string
  blobUrl: string                   // Pre-resolved by useExport before worker handoff
  time: number                      // Source time in seconds
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fit: 'cover' | 'contain' | 'fill'
}

export interface RenderedFrame {
  svg: string                       // Complete <svg> document, ready to rasterize
  media: MediaLayer[]               // Composited on top of SVG, in source order
  width: number
  height: number
  backgroundColor: string
}
```

---

## 4. UI patterns

### Modal layout

ExportModal width: `560px`. Three vertical sections inside the modal body, separated by `border-b border-border`:

1. **Format picker** — one row of format pills (5 buttons), then per-format options panel below
2. **Preflight** — list of issues grouped by severity, color-coded
3. **Action footer** — "Cancel" (secondary), "Export" (primary, disabled if `!canExport`)

When `status === 'exporting'`, replace the body with `ExportProgress`.

When `status === 'done'`, replace the body with a success state: filename, file size, "Download" (primary, triggers download), "Done" (closes modal).

### Format pill row

Use `Button` primitive. Active state via the standard `bg-accent-soft text-accent border-accent` pattern from CLAUDE.md.

```vue
<div class="flex gap-1.5">
  <button
    v-for="fmt in formats"
    :key="fmt.id"
    :data-active="selected === fmt.id"
    class="px-3 h-input-sm text-xs border border-border rounded-sm transition-colors
           hover:border-border-l data-[active=true]:bg-accent-soft
           data-[active=true]:text-accent data-[active=true]:border-accent"
    @click="selected = fmt.id"
  >
    {{ fmt.label }}
  </button>
</div>
```

### Preflight rendering

Group by severity. Order: errors first, warnings, info. Severity styling:

| Severity | Icon dot | Text color |
|----------|----------|------------|
| error    | `bg-danger`  | `text-danger`  |
| warning  | `bg-warning` | `text-warning` |
| info     | `bg-text-3`  | `text-text-2`  |

Each row: `px-3 py-2 flex items-start gap-2 border-b border-border last:border-0`. Element-scoped issues append `· {elementName}` in `text-text-3`.

If `issues.length === 0`: render a single `text-text-3 text-xs px-3 py-4 text-center` row reading `No issues. Ready to export.`

### Progress UI

```
Exporting frame 47 of 240
[████████████░░░░░░░░░░░░░░░░░░░] 47%
[Cancel]
```

Bar: 6px tall, `bg-bg-3` track, `bg-accent` fill. Frame counter in `font-mono text-xs text-text-2`.

---

<a name="phase-e1"></a>
## Phase E1 — Export shell + preflight system ✅

**Goal**: Click Export → modal opens → pick a format → see (empty) preflight → click Export → see a working progress bar that does nothing real → success screen with a stub download. No actual export logic. This phase exists so the next four phases just plug into a working pipeline.

### Completed

- Added `src/types/export.ts` with all definitions from §3.
- Added `useExportStore`:
  - State: `currentJob: ExportJob | null`
  - Actions: `startJob(format, options, artboardId)`, `setPreflight(report)`, `setStatus(status)`, `setProgress(currentFrame, totalFrames)`, `setResult(blob, fileName)`, `setError(msg)`, `cancel()`, `reset()`
  - This store does NOT actually run exports — it tracks state. The `useExport` composable orchestrates.
- Added `composables/useExport.ts`:
  - Returns `{ job, openExport, changeFormat, changeOptions, changeArtboard, runExport, downloadResult, cancelExport, closeExport }`
  - `openExport()` defaults to `selection.activeArtboardId`; wires directly to real export logic (stub phase was skipped — E1–E5 shipped together)
  - `downloadResult()` uses standard `URL.createObjectURL` + anchor click pattern
- Added `_showExport` to `useEditorModals.ts`, exposed as `showExport`.
- Added Export button to `EditorTopbar.vue` (right side, before Settings).
- Built all `features/export/*` components per §4.
- Wired up the modal in `EditorShell.vue`.

### Format picker behavior

When user changes format, immediately calls that format's `preflight()` and updates the job's preflight. Issues surface live without requiring an extra button click.

### Artboard selection

Defaults to `selection.activeArtboardId`. If the project has multiple artboards, shows a `Select` above the format picker labeled "Artboard". Hidden when the project has only one artboard.

### Done when ✅

- Click Export in topbar → modal opens with format picker showing all 5 formats.
- Selecting a format shows the corresponding options panel.
- Preflight section renders the empty state ("No issues. Ready to export.").
- Success screen shows filename + file size; "Download" button triggers download.
- Cancel mid-export returns to format picker without artifacts.
- No `as any`. Every file under 200 lines.

---

<a name="phase-e2"></a>
## Phase E2 — Lottie exporter ✅

**Goal**: A working `.json` Lottie export for the common cases (transform, opacity, fills, strokes, simple paths, text) with explicit warnings for what gets baked or dropped. Validates against `lottie-web` playback.

### Completed

- Added `core/export/lottie/index.ts` exposing `buildLottie(input)` and `preflightLottie(input)`.
- `input` is `{ project: ProjectData, frame: Frame, imageData: Record<string, string> }`.
- Added per-element-type mappers in `core/export/lottie/elements/`. One file each: `rect.ts`, `ellipse.ts`, `line.ts`, `polygon.ts`, `star.ts`, `path.ts`, `text.ts`, `group.ts`, `image.ts`. `video.ts` skipped — video is dropped with a preflight warning.
- Added `core/export/lottie/easing.ts` translating Loopa's `EasingType` to Lottie bezier handles.
- Added `core/export/lottie/tracks.ts` translating `Track[]` into Lottie's animatable property shape (see §10).
- Added `core/export/lottie/types.ts` for internal Lottie type definitions (`LottieLayer`, `LottieAsset`, etc.) — not in original spec but a clean addition.
- Wired `preflightLottie` into the shell's preflight call.
- Wired `buildLottie` into `useExport.runExport()` for the lottie format.
- File name: `${projectName}-${frameName}.json`.

### Easing strategy (per CLAUDE.md easing.ts)

| Loopa easing | Lottie strategy |
|--------------|-----------------|
| `linear` | Linear bezier handles `[0,0]/[1,1]` |
| `ease-in`, `ease-out`, `ease-in-out` | Map to standard CSS bezier control points |
| `ease-in-cubic` etc. | Standard cubic-bezier control points |
| `cubic-bezier(x1,y1,x2,y2)` | Use control points directly |
| `ease-in-back`, `ease-out-back`, `ease-in-out-back` | Use known back-easing bezier approximation |
| `ease-out-bounce`, `ease-out-elastic`, `steps(n)` | **Bake**: sample easing fn at every frame in the segment, emit a keyframe per frame |

Baking means: between keyframes A (frame 10) and B (frame 30), insert linear-interpolated keyframes at frames 11, 12, ..., 29 with values matching the eased curve. Emit one preflight `info` per baked track: `"Easing 'ease-out-bounce' on '{element}.{property}' was baked to per-frame keyframes for fidelity."`

### Motion path strategy

Motion paths cannot be expressed natively in Lottie's shape model in a way that round-trips. **Bake**: replace the element's x/y tracks with per-frame position keyframes computed via `pointAtProgress` from `core/path/motionPathMath.ts`, sampling between `motionPath.startFrame` and `motionPath.endFrame`. If `rotateAlongPath`, also bake rotation. Emit one preflight `info`: `"Motion path on '{element}' was baked to position keyframes."`

### Mask strategy

Lottie supports mask groups via the `tt: 1` (alpha matte) attribute. Implement as: when a `GroupElement` has `hasMask: true`, emit the first child as a matte layer with `td: 1` and the second child onward with `tt: 1` referencing the matte. If the masked group has more than two children, emit a preflight `warning`: `"Mask group '{name}' has multiple masked children — only the first is fully supported in Lottie."`

### Video handling

`VideoElement` instances are dropped. Per video element, emit a preflight `warning`: `"Video element '{name}' will not appear in the Lottie export — Lottie does not support video playback."`

### Image handling

Embed image data as base64 in the Lottie `assets` array (`p` field with data URI). Read blob via `IDBMediaRepo.get(imageStorageId)` in `useExport.ts` BEFORE calling `buildLottie`, pass image data through the `input` object. **Do not access IndexedDB from inside `core/`.**

### Property mapping reference

See §10 for the full property → Lottie field table.

### Done when ✅

- A frame containing animated rects with rotation, opacity, and fill color produces a `.json` that plays correctly in `lottie-web`.
- Bouncing easing produces visually correct playback (verified by eye against Loopa's preview).
- A motion-path-driven element produces correct playback in lottie-web.
- A frame with a video element exports successfully with a preflight warning, omitting the video.
- A masked group exports with correct alpha masking in lottie-web.
- Preflight surfaces real issues (no issues should appear for a basic frame; expected issues appear for video/bounce/motion-path).
- File name pattern matches spec.

---

<a name="phase-e3"></a>
## Phase E3 — Render primitive ✅

**Goal**: A pure function `renderProjectAtFrame(project, frameId, frame, options) → RenderedFrame` that walks the document, computes every element at the given frame, and returns an SVG string + media layer descriptors. Used immediately for project thumbnails. Foundation for E4 and E5.

### Completed

- Added `core/export/render/svgBuilder.ts`: per-element-type SVG-string functions.
  - One function per element type: `rectToSvg`, `ellipseToSvg`, `lineToSvg`, `polygonToSvg`, `starToSvg`, `pathToSvg`, `textToSvg`, `imageToSvg`, `groupToSvg`.
  - These mirror what the `*Element.vue` renderers produce, but as strings, with no Vue.
  - Image elements: embed data URI passed through `options.imageData`.
  - Video elements: emit nothing — video lives in the `media` array, not in SVG.
  - Mask groups: emit `<defs><clipPath>...</clipPath></defs>` and apply via `clip-path` attribute.
- Added `core/export/render/renderProjectAtFrame.ts`:
  - Signature: `renderProjectAtFrame(project, frameId, frameNum, options) → RenderedFrame`
  - Walks `frame.elementIds` recursively, computes each element via `computeElementAt`, dispatches to svgBuilder.
  - Returns `{ svg, media, width, height, backgroundColor }`.
- Added `composables/useThumbnail.ts`:
  - Calls `renderProjectAtFrame` at frame 0, rasterizes via `Image` + `<canvas>` at 240px wide, returns a data URI.
  - Wired into the autosave path.

> **Deviation**: `core/export/render/types.ts` was not created. `RenderedFrame` and `MediaLayer` live in `src/types/export.ts` instead — a better placement since they are public API types consumed across layers.

### Done when ✅

- Saving a project populates `meta.thumbnail` with a valid data URI.
- The thumbnail visually matches frame 0 of the project at low resolution.
- `renderProjectAtFrame` is a pure function with zero Vue/Pinia/DOM imports.
- Calling it twice for the same input produces byte-identical SVG strings.

---

<a name="phase-e4"></a>
## Phase E4 — Raster pipeline + PNG sequence + GIF ✅

**Goal**: Multi-frame rasterization in a Web Worker, producing PNG sequence (`.zip`) and GIF (`.gif`).

### Dependencies added

```bash
pnpm add gifenc fflate
```

> **Deviation**: `gif.js` was not used. `gifenc` was used instead. Reason: `gif.js` spawns its own sub-workers, which is not supported when the caller is already a Web Worker. `gifenc` is pure JS, works anywhere, and produces equivalent output. The type shim is `src/types/shims/gifenc.d.ts`.

### Completed

- Added `core/export/raster/composeFrame.ts`:
  - Signature: `composeFrame(rendered: RenderedFrame, scale: number) → Promise<ImageBitmap>`
  - Uses `createImageBitmap(svgBlob)` to decode SVG; returns directly at scale=1 or resizes via `createImageBitmap(raw, { resizeWidth, resizeHeight })`.
  - Video `MediaLayer` compositing is intentionally skipped (`// TODO: move video composition into worker`). The `media` array is produced by `renderProjectAtFrame` but not composited.
  - **Critical**: `OffscreenCanvas.transferToImageBitmap()` throws `InvalidStateError` in some Chrome versions when called on a canvas with an active 2D context. This approach was found during testing and avoided entirely.
- Added `core/export/raster/renderJob.ts`:
  - `async function* runRenderJob(project, frameId, options): AsyncGenerator<{ index, total, bitmap }>`
  - Iterates frames 0..totalFrames, calls `renderProjectAtFrame`, then `composeFrame`, yields results.
- Added `core/export/raster/png.ts`:
  - Consumes the renderJob iterable, encodes each bitmap via `OffscreenCanvas.convertToBlob`, packages with `fflate.zipSync`.
  - Output zip name: `${projectName}-${frameName}.zip`. Inside: `frame-0001.png`, `frame-0002.png`, ...
- Added `core/export/raster/gif.ts`:
  - Uses `gifenc` (`GIFEncoder`, `quantize`, `applyPalette`).
  - Frame delay = `Math.round(100 / fps)` centiseconds.
  - Quality maps to max color count: low=64, medium=128, high=256.
- Added Web Worker entry: `src/workers/exportWorker.ts`.
  - Receives `{ format, project, frameId, options, imageData }`.
  - Posts `{ type: 'progress', current, total }`, `{ type: 'done', blob }`, or `{ type: 'error', message }`.
- Added `composables/useExportWorker.ts`:
  - Wraps worker lifecycle; exposes `runRasterExport(format, project, frameId, options, imageData, onProgress) → Promise<Blob>` and `cancel()`.
  - **Deviation from spec**: returns `{ runRasterExport, cancel }` with a Promise + callback, not a `{ progress$, result }` reactive pair. Simpler and avoids a stream abstraction for a one-shot operation.
  - Strips Vue reactive Proxies before `postMessage` via `JSON.parse(JSON.stringify(data))`.
- Wired into `useExport.runExport()` for `png-sequence` and `gif`.

### Critical caveats (as built)

- **Image element data**: pre-resolved to data URIs on main thread via `gatherImageData()` in `core/export/imageData.ts` before posting to worker. Worker has no IndexedDB access.
- **SVG rasterization in workers**: `Image()` is not available in workers. `createImageBitmap(svgBlob)` is used instead. `OffscreenCanvas.transferToImageBitmap()` is avoided (see composeFrame note above).
- **Font loading**: SVG `<text>` elements depend on web fonts. The worker inherits no font context. Text exports are best-effort; consider rasterizing text as paths in a future phase.

### Per-format preflight

- `preflightPng(project, frameId)` — empty by default. Add `info` if any element type isn't yet rasterized correctly.
- `preflightGif(project, frameId)` — same. Add `info`: "GIF has no audio. Audio from video elements will be lost." (informational even if there are no videos — keeps the messaging consistent.)

### Done when ✅

- Export PNG sequence on a 240-frame project produces a `.zip` with 240 numbered PNGs that visually match the editor preview.
- Export GIF produces a playable `.gif` at the project's fps.
- Progress bar updates accurately during export.
- Cancel mid-export terminates the worker and resets job state.
- A 600-frame project does not freeze the UI.

---

<a name="phase-e5"></a>
## Phase E5 — MP4 + WebM via WebCodecs ✅

**Goal**: Video export reusing the raster pipeline. No audio in v1.

### Dependencies added

```bash
pnpm add mp4-muxer webm-muxer
```

### Completed

> **Deviation**: `webCodecsEncoder.ts`, `mp4.ts`, and `webm.ts` were not created as separate files. All three live in a single `core/export/raster/video.ts` with an internal `encodeToMuxer` shared helper that takes codec string and muxer's `addChunk` callback. Public exports are `buildMp4` and `buildWebm`. The consolidation is appropriate at 109 lines total.

- Added `core/export/raster/video.ts`:
  - `buildMp4(frames, fps, width, height, bitrate, onProgress) → Promise<Blob>`: H.264 via `avc1.42001f`, muxed with `mp4-muxer`.
  - `buildWebm(frames, fps, width, height, bitrate, onProgress) → Promise<Blob>`: VP9 via `vp09.00.10.08`, muxed with `webm-muxer`.
  - Both formats enforce even pixel dimensions (required by H.264 and VP9).
  - Shared `encodeToMuxer` internal helper eliminates duplicated encode loop.
- Wired both into the worker alongside PNG/GIF.

### WebCodecs availability

Check `'VideoEncoder' in self` in the worker. If absent (older Safari, Firefox without flags), the format-specific preflight returns an `error`-severity issue: `"MP4 export requires WebCodecs, which is not available in this browser. Try Chrome or a recent Safari."` This blocks the export button.

The format picker should still show MP4/WebM as options — surfacing the error in preflight teaches the user about the limitation rather than hiding it.

### Per-format preflight

- `preflightMp4(project, frameId)`:
  - WebCodecs availability check (error if absent)
  - `info`: "MP4 export does not include audio in this version. Audio from video elements will be lost."
- `preflightWebm(project, frameId)`: same shape.

### Bitrate defaults

| Format | Default kbps |
|--------|-------------|
| MP4 720p | 5000 |
| MP4 1080p | 8000 |
| WebM 720p | 4000 |
| WebM 1080p | 6500 |

User can override in options panel.

### Done when ✅

- Export MP4 of a 10-second 1280×720 project produces a playable `.mp4` in QuickTime, VLC, and browsers.
- Export WebM produces a playable `.webm` in Chrome and Firefox.
- WebCodecs-absent browser correctly blocks export with the preflight error.
- File sizes are reasonable (a 10-second 720p export should be under 10MB at default bitrate).

---

<a name="format-reference"></a>
## 10. Format reference: Lottie property + easing mappings

This is the lookup table for Phase E2. The Lottie schema reference is `lottie-web`'s data model; verify against `lottie-web` playback, not against any third-party Lottie editor.

### Project root

```ts
{
  v: '5.7.0',                       // Schema version
  fr: artboard.fps,
  ip: 0,                            // In-point
  op: artboard.totalFrames,         // Out-point
  w: artboard.width,
  h: artboard.height,
  nm: project.meta.name,
  ddd: 0,                           // Not 3D
  assets: [],                       // Image assets here
  layers: [],                       // One layer per element, top of stack first
  meta: { g: 'Loopa' }
}
```

### Element → Layer mapping

| ElementType | Lottie layer type (`ty`) |
|-------------|--------------------------|
| rect, ellipse, line, polygon, star, path | `4` (shape layer) |
| text | `5` (text layer) |
| group | `0` (precomp), with children as a nested precomp definition |
| image | `2` (image layer), references an asset in the assets array |
| video | (skipped — preflight warning) |

### Common transform mapping (`ks` — transform property)

| Loopa property | Lottie field | Notes |
|----------------|--------------|-------|
| x, y | `ks.p` | `[x, y]` array |
| rotation | `ks.r` | Degrees |
| opacity | `ks.o` | Scale 0..1 → 0..100 |
| scaleX, scaleY | `ks.s` | `[scaleX*100, scaleY*100]` |
| transformOrigin.x, .y | `ks.a` | Anchor point in element-local space: `[width*tx, height*ty]` |

### Animatable property shape

For a non-animated property:
```ts
{ a: 0, k: <value> }
```

For an animated property:
```ts
{
  a: 1,
  k: [
    { t: <frame>, s: [<value>], i: { x: [...], y: [...] }, o: { x: [...], y: [...] } },
    { t: <frame>, s: [<value>] },                // last keyframe has no easing
  ]
}
```

The `i` (in-tangent) of keyframe N pairs with the `o` (out-tangent) of keyframe N to define the easing of segment N → N+1. Both are normalized arrays per dimension.

### Shape contents (for shape layers)

Inside a shape layer's `shapes` array:

| Loopa | Lottie shape group |
|-------|---------------------|
| rect | `{ ty: 'rc', s: [width, height], p: [0,0], r: cornerRadius }` + fill + stroke + transform |
| ellipse | `{ ty: 'el', s: [width, height], p: [0,0] }` + fill + stroke + transform |
| polygon | `{ ty: 'sr', sy: 2, pt: sides, p: [0,0], r: radius }` |
| star | `{ ty: 'sr', sy: 1, pt: starPoints, ir: innerRadius, or: outerRadius, p: [0,0] }` |
| path | `{ ty: 'sh', ks: { a: 0, k: { i: [...], o: [...], v: [...], c: closed } } }` — see path conversion below |
| line | Convert to a path with two points |

### Fill and stroke

```ts
// Fill
{ ty: 'fl', c: { a: 0, k: [r, g, b, 1] }, o: { a: 0, k: opacity*100 } }
// Stroke
{ ty: 'st', c: { a: 0, k: [r, g, b, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: width },
  lc: capCode, lj: joinCode, ml: miterLimit }
```

Color: convert hex `'4353ff'` → `[0.263, 0.325, 1, 1]` (RGB normalized 0..1, plus alpha).

`lc` (line cap): `1=butt, 2=round, 3=square`. `lj` (line join): `1=miter, 2=round, 3=bevel`.

### Path point conversion

Loopa's `PathPoint` uses absolute handle positions; Lottie's path stores in/out tangents as **relative offsets from the vertex**.

```ts
// For each PathPoint p:
v.push([p.x, p.y])
i.push([p.handleIn ? p.handleIn.x - p.x : 0, p.handleIn ? p.handleIn.y - p.y : 0])
o.push([p.handleOut ? p.handleOut.x - p.x : 0, p.handleOut ? p.handleOut.y - p.y : 0])
```

For `closed: true`, `c: true`. Otherwise `c: false`.

### Easing translation

Bezier handles in Lottie's keyframe easing use the **same convention as CSS cubic-bezier**: `i.x` and `o.x` are control point X coordinates (0..1), `i.y` and `o.y` are control point Y coordinates (can exceed 0..1 for overshoot eases).

| Loopa easing | `o` (out of prev) | `i` (into next) |
|--------------|-------------------|-----------------|
| `linear` | `{x: [1], y: [1]}` | `{x: [0], y: [0]}` |
| `ease-in` | `{x: [0.42], y: [0]}` | `{x: [1], y: [1]}` |
| `ease-out` | `{x: [0], y: [0]}` | `{x: [0.58], y: [1]}` |
| `ease-in-out` | `{x: [0.42], y: [0]}` | `{x: [0.58], y: [1]}` |
| `ease-in-cubic` | `{x: [0.32], y: [0]}` | `{x: [0.67], y: [0]}` |
| `ease-out-cubic` | `{x: [0.33], y: [1]}` | `{x: [0.68], y: [1]}` |
| `ease-in-out-cubic` | `{x: [0.65], y: [0]}` | `{x: [0.35], y: [1]}` |
| `cubic-bezier(x1,y1,x2,y2)` | `{x: [x1], y: [y1]}` | `{x: [x2], y: [y2]}` |
| `ease-in-back` | `{x: [0.36], y: [0]}` | `{x: [0.66], y: [-0.56]}` |
| `ease-out-back` | `{x: [0.34], y: [1.56]}` | `{x: [0.64], y: [1]}` |
| `ease-in-out-back` | `{x: [0.68], y: [-0.6]}` | `{x: [0.32], y: [1.6]}` |
| `ease-out-bounce`, `ease-out-elastic`, `steps(n)` | **bake** (see Phase E2) | n/a |

For multi-dimensional values (position has x and y), the arrays have one entry per dimension: `{x: [0.42, 0.42], y: [0, 0]}`.

### Property path → Lottie field

When walking `Track[]` for an element, map by `track.property`:

| Loopa property path | Lottie target |
|---------------------|---------------|
| `x` or `y` | Combined into `ks.p` (synthesize from both tracks) |
| `rotation` | `ks.r` |
| `opacity` | `ks.o` (×100) |
| `scaleX`, `scaleY` | Combined into `ks.s` |
| `fills.0.color` | First fill's `c` field |
| `fills.0.opacity` | First fill's `o` field (×100) |
| `strokes.0.color` | First stroke's `c` field |
| `strokes.0.width` | First stroke's `w` field |
| `width`, `height` | For rect/ellipse: shape's `s` field (combined) |
| `d` | For path: shape's `ks` field — convert SVG path to Lottie point array (use `core/path/parser.ts`) |
| `points` | Same as `d` but already in Loopa's PathPoint format |
| `text` | Text layer's `t.d.k[0].s.t` field |
| `fontSize` | Text layer's `t.d.k[0].s.s` field |

For paired tracks (x+y, scaleX+scaleY): if only one is animated and the other is static, the static value is repeated in every keyframe array.

### Animation engine integration

To compute the "static" base value of a property when the track is animated:

```ts
// In tracks.ts
const baseValue = element[property] // For top-level
const baseValue = valueAtPath(element, property) // For nested
```

For animated properties, walk `track.keyframes` and emit one Lottie keyframe per Loopa keyframe (after baking transformations described in Phase E2).

---

## How to use this document with Claude Code

1. Place this file as `EXPORT.md` next to `CLAUDE.md` and `REBUILD.md` at the repo root.
2. Start a Claude Code session and instruct: *"Read CLAUDE.md, then EXPORT.md. Start Phase E1. Stop when the 'done when' criteria are met and tell me to verify."*
3. Do not let it run multiple phases unsupervised. Each phase ends in a commit.
4. After E1, the next prompt is *"Phase E1 verified. Proceed to Phase E2."*
5. If a phase produces output that drifts from CLAUDE.md conventions (file too long, `as any`, hand-rolled UI primitives, store touching IndexedDB), make it fix that before moving on.