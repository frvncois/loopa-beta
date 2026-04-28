# CLAUDE.md

Project-level instructions for Claude Code. Read this BEFORE writing any code.

---

## Project

**Loopa** — browser-based SVG/motion graphics keyframe animation tool. Webflow-inspired dark UI. Local-first by default; cloud-backed via Supabase for authenticated users. Full export pipeline (Lottie, PNG sequence, GIF, MP4, WebM) ships in v2. See `SUPABASE.md` for the backend/auth/dashboard/billing spec.

**The visual design must match the v1 prototype exactly.** Tokens and patterns are defined below; they are non-negotiable.

---

## Commands

```bash
pnpm install        # or npm install
pnpm dev            # vite dev server, localhost:5173
pnpm build          # vue-tsc --noEmit && vite build
pnpm preview        # preview production build
pnpm lint           # eslint
pnpm format         # prettier
```

---

## Tech Stack

- **Vue 3.5** with `<script setup lang="ts">` — mandatory on every component
- **TypeScript ~5.6**, strict mode
- **Vite 5+** — path alias `@/` → `./src/`
- **Pinia 2.2+** — composition-style stores (`defineStore('id', () => {...})`)
- **Vue Router 4.4+**
- **Tailwind v4** — CSS-first config via `@theme`. NO `tailwind.config.ts`.
- **No component libraries.** All UI primitives are hand-built.
- **No icon libraries.** Inline SVG components in `src/ui/icons/`.

Vue 3.5 features to use freely: `useTemplateRef()`, `useId()`, reactive props destructuring, `defineModel()`.

---

## Hard Architectural Rules

These are non-negotiable. Violations are bugs.

1. **Layer dependencies are one-directional.**
   ```
   views ← features ← (ui, tools, composables, stores) ← core ← types
   ```
   `core/` NEVER imports Vue. `types/` NEVER imports anything.

2. **Stores never touch storage APIs directly.** No `localStorage`, no `indexedDB`, no `fetch`. They call repositories from `core/persistence/`.

3. **No `provide/inject` for cross-component plumbing.** Stores are globally reactive via Pinia. Composables are imported where needed. Provide/inject is reserved for genuine context (theme, scoped registries) — not for passing data around.

4. **No `window.dispatchEvent` / custom events as a message bus.** Use direct composable calls or store actions.

5. **Mutations to the document store go through history transactions.**
   ```ts
   history.transact('Move element', () => {
     document.updateElement(id, { x: 100 })
   })
   ```
   For continuous actions (drag/scrub): `beginTransaction()` / `commit()`.

6. **Tools are self-contained modules.** Each tool exports a controller with `onPointerDown/Move/Up`. The canvas dispatches; it doesn't decide.

7. **No file may exceed ~400 lines.** If it does, it's wrong. Split it. Inspector sections, shape renderers, and tools should be 30–150 lines each.

8. **No `as any`.** If you reach for it, either the type is wrong or the abstraction is wrong. Fix the underlying issue.

---

## Folder Structure

```
src/
├── main.ts
├── App.vue
├── assets/styles/main.css      # Tailwind v4 entry + @theme tokens
│
├── types/                      # Pure TS types, zero deps
├── core/                       # Pure TS, ZERO Vue imports
│   ├── animation/              # easing, interpolate, tracks, engine
│   ├── elements/               # factory, bounds
│   ├── path/                   # builder, motionPathMath
│   ├── persistence/            # ProjectRepository + impls
│   ├── export/                 # lottie/, render/, raster/, imageData.ts
│   └── utils/
│
├── stores/                     # Pinia stores (8 total)
├── composables/                # Cross-cutting reactive helpers
│
├── ui/                         # Design-system primitives (Tailwind)
│   ├── inspector/              # Section, Row, Label, NumberField, etc.
│   └── icons/
│
├── tools/                      # One folder per tool (self-contained)
│   ├── _base/                  # ToolDispatcher, registry, types
│   ├── select/  hand/  rect/  ellipse/  line/  polygon/  star/
│   ├── text/  pen/  path-edit/  motion-path/
│
├── features/                   # High-level UI features
│   ├── canvas/  layers/  properties/  timeline/
│   ├── frames/  masks/  motion-paths/  export/  landing/
│
├── layout/                     # EditorShell, EditorTopbar
├── views/                      # EditorView
└── router/index.ts
```

**Rules**:
- Lowercase folder names. PascalCase component files. camelCase composable/util files.
- No barrel files (`index.ts` re-exports) inside `features/` or `tools/`. Explicit imports.
- `types/` and `ui/icons/` MAY have a barrel for ergonomics.

---

## Stores (Pinia)

Nine stores, each with one job. NEVER add to a store outside its responsibility.

| Store | Owns |
|-------|------|
| `useDocumentStore` | The persisted document: frames, elements, tracks, masks, motionPaths. Mutations only. No UI state. |
| `useSelectionStore` | `selectedIds`, `activeFrameId`, `activeGroupId`, `editingPathId`, hover state |
| `useViewportStore` | zoom, pan, grid, snap, rulers, guides |
| `useToolStore` | `currentTool`, tool-specific options |
| `useTimelineStore` | `currentFrame`, `isPlaying`, fps, totalFrames, loop, direction |
| `useHistoryStore` | Transaction-based undo/redo. Snapshot strategy. |
| `useClipboardStore` | Copy/paste with new IDs |
| `useExportStore` | Current export job state machine (idle → exporting → done / error / cancelled). Tracks job, preflight, progress, result. Does NOT run exports — that is `useExport`. |
| `useAuthStore` | Supabase session: `user`, `profile` (plan, storage), `status` (loading / anonymous / authenticated). `signIn`, `signOut`, `refresh`. Initialized before router mounts. |

Stores are imported where needed. Don't pass them through props.

---

## Design Tokens

All tokens live in `src/assets/styles/main.css` under `@theme`. They generate Tailwind utilities automatically.

### Tailwind utility mapping (the ones you'll use most)

| Token | Tailwind class | Value |
|-------|---------------|-------|
| Surfaces | `bg-bg-0` … `bg-bg-6` | `#0c0c0f` … `#33333e` |
| Borders | `border-border`, `border-border-l` | `#252530`, `#2e2e3a` |
| Text | `text-text-1` … `text-text-4` | `#ededf0` … `#4a4a5c` |
| Accent | `bg-accent`, `text-accent`, `border-accent` | `#4353ff` |
| Accent hover | `hover:bg-accent-h` | `#5c6aff` |
| Accent soft | `bg-accent-soft` | `rgb(67 83 255 / 0.10)` |
| Semantic | `text-success`, `text-warning`, `text-danger` | green / yellow / red |
| Font | `font-sans` (DM Sans), `font-mono` (JetBrains Mono) | |
| Radii | `rounded-sm` (4px), `rounded-md` (6px), `rounded-lg` (10px) | |
| Inspector heights | `h-input` (26px), `h-input-sm` (22px) | |
| Inspector label | `w-label` (72px) | |
| Layout | `h-topbar` (44px), `h-toolbar` (38px) | |

For one-off values use `[arbitrary]` syntax: `min-h-[1.625rem]`, `gap-[0.375rem]`.

---

## Style Conventions

### Tailwind usage

- **Use Tailwind utilities directly in templates.** Do not extract every component into `@apply` blocks.
- **`@apply` is only for true repetition** — e.g., the inspector field style used by 5+ primitives. Even then, prefer making a primitive component.
- **No `<style scoped>` blocks** unless the styling is genuinely impossible in Tailwind (rare: complex SVG selectors, `:has()` combinations).
- **Avoid arbitrary values when a token exists.** `h-input` not `h-[26px]`.
- **State variants**: `hover:`, `focus:`, `disabled:`, `aria-selected:`. Use `data-*` attributes for component state, not classes you toggle from script.
- **`cn()` helper** lives in `src/core/utils/cn.ts` — use it for conditional class composition (clsx + tailwind-merge).

### The Webflow-inspired pattern

This is what makes Loopa feel like Loopa. Every primitive must respect it:

- **Density**: 26px input height, 11px font, 1px borders, tight gaps (4–6px)
- **Hover behavior**: borders go from `border-border` → `border-border-l`, backgrounds from `bg-bg-3` → `bg-bg-5`
- **Focus**: `focus:border-accent` only (no ring, no glow)
- **Active**: `bg-accent-soft text-accent border-accent`
- **Disabled**: `opacity-40 cursor-not-allowed`
- **Transitions**: `transition-colors duration-[140ms]` (use the `--ease-editor` cubic-bezier when needed via arbitrary value)

---

## Inspector Patterns (the most-repeated UI in the app)

Every inspector section in the right panel follows this exact shape. The primitives in `src/ui/inspector/` enforce it. NEVER hand-roll these classes in feature code — always use the primitives.

```vue
<!-- Canonical inspector section -->
<CollapsibleSection title="Position">
  <Row>
    <Label>X</Label>
    <NumberField v-model="x" />
  </Row>
  <Row>
    <Label>Y</Label>
    <NumberField v-model="y" />
  </Row>
</CollapsibleSection>
```

The primitives expand to (for reference, do not duplicate):

| Primitive | Tailwind |
|-----------|----------|
| `CollapsibleSection` | `px-3 py-2.5 border-b border-border` with collapsible header |
| `Row` | `flex items-center gap-1.5 min-h-input` |
| `Label` | `w-label min-w-label text-xs text-text-3 font-medium truncate` |
| `NumberField` (root) | `flex-1 min-w-0 h-input bg-bg-3 border border-border rounded-sm px-[7px] font-mono text-xs text-text-1 outline-none transition-colors focus:border-accent disabled:opacity-40` |
| `NumberField.is-pair` | replaces `flex-1` with `w-[4.75rem]` |
| `Select` | same as NumberField but with custom chevron background |
| `ColorField` | `flex-1 min-w-0 h-input flex items-stretch border border-border rounded-sm overflow-hidden` containing swatch (26x26) + hex input |
| `Toggle` | 28×16 pill, `bg-bg-4` (off) / `bg-accent` (on), 12px circle thumb |

---

## Naming Conventions

| Thing | Pattern | Example |
|-------|---------|---------|
| Pinia store | `use<Name>Store` | `useDocumentStore` |
| Composable | `use<Name>` | `useElementTransform` |
| Component | PascalCase | `NumberField.vue` |
| Tool controller | `<Name>Tool.ts` | `RectTool.ts` |
| Type file | kebab-case | `motion-path.ts` |
| Store action | verb-first | `addElement`, `commitDrag` |
| Composable return | `{ state, actions }` shape | see below |

**Composable return convention**: return an object whose top-level keys are either reactive state (`Ref<T>`/`ComputedRef<T>`) or methods. No mixed objects. Example:

```ts
export function useElementTransform() {
  const isDragging = ref(false)
  function startDrag(e: PointerEvent, id: string) { /* ... */ }
  function startResize(e: PointerEvent, handle: string) { /* ... */ }
  return { isDragging, startDrag, startResize }
}
```

---

## Animation Model (read this twice)

Loopa v2 uses **per-property tracks**, not flat keyframe patches.

```ts
interface Track {
  id: string
  elementId: string
  property: PropertyPath          // 'x' | 'y' | 'opacity' | 'fills.0.color' | ...
  keyframes: Keyframe[]           // sorted by frame, ascending
  enabled: boolean
}

interface Keyframe {
  id: string
  frame: number
  value: number | string | PathPoint[]
  easing: EasingType
}
```

The animation engine is a pure function:

```ts
// core/animation/engine.ts
export function computeElementAt(
  element: Element,
  tracks: Track[],
  frame: number
): Element
```

It walks each track, interpolates the value at `frame`, and applies it to a clone of `element` using `valueAtPath` (set by string path). No flat-to-nested reconstruction layer. No `useAnimatedEditing`. The merged element is what every consumer sees.

**Inspector property → track binding** is bidirectional: changing `x` in the inspector either updates `element.x` (no track exists) or appends/updates a keyframe at `currentFrame` (track exists). The composable `useAnimatedProperty(elementId, propertyPath)` handles this and is what every inspector field uses.

---

## History (transactions, not action enumeration)

```ts
const history = useHistoryStore()

// Single mutation
history.transact('Move element', () => {
  document.updateElement(id, { x: 100, y: 50 })
})

// Continuous (drag/scrub) — opens, mutations accumulate, commit on pointerup
history.beginTransaction('Drag element')
// ... onMove: document.updateElement(id, {...})
history.commit()

// Cancel mid-transaction (e.g., escape key)
history.cancel()
```

Snapshot the document at transaction boundaries. Cap at 100 snapshots. There is NO `$onAction` in this codebase.

---

## Things That Do Not Exist in v2

If you're tempted to add any of these, stop:

- AI assistant, animation suggestions
- Figma integration, OAuth providers, Cloudflare worker
- SVG+CSS export
- Interactions / triggers (hover, click navigation)
- Edit collaboration, realtime sync, CRDT
- `window.dispatchEvent` event bus
- `lib/` folder (it's `core/` now)
- `editorStore` (it's split into stores)
- `useAnimatedEditing` (per-property tracks make it unnecessary)

---

## Export / Worker Conventions

These emerged from the export system build and are non-obvious:

- **SVG rasterization in Web Workers**: use `createImageBitmap(svgBlob)` — `new Image()` is not available in workers. Do NOT use `OffscreenCanvas.transferToImageBitmap()` on a canvas that has an active 2D context; it throws `InvalidStateError` in some Chrome versions.
- **Pinia state → Web Worker**: always strip reactive Proxies before `postMessage`. Use `JSON.parse(JSON.stringify(data))` — structured clone throws `DataCloneError` on Vue Proxy objects from Pinia store state.
- **Image data pre-resolution**: the worker has no IndexedDB access. All image blobs must be resolved to data URIs on the main thread (via `gatherImageData` in `core/export/imageData.ts`) before the project is posted to the worker.

---

## When in doubt

1. Check `REBUILD.md` for the phased plan and detailed specs.
2. Check existing primitives in `src/ui/` before creating new ones.
3. Check existing tools in `src/tools/` before adding logic to the canvas.
4. The token answer is almost always "use a Tailwind utility from `@theme`." If you're using arbitrary values frequently, the token is missing — add it to `@theme` instead.
