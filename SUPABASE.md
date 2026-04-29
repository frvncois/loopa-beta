# SUPABASE.md — Loopa backend, auth, dashboard, billing

**Read CLAUDE.md first.** This document assumes you've internalized the conventions in CLAUDE.md, the architecture rationale in REBUILD.md, and the export work in EXPORT.md. It specifies the backend integration: Supabase, auth, dashboard, cloud projects, plan limits, Stripe billing.

Each phase ends in something runnable. Don't move on until the "done when" criteria are met. Commit at phase boundaries.

**Strict scope rule for Claude Code**: each phase explicitly lists which files may be created or modified. Do not touch files outside that list. If a needed change falls outside scope, stop and ask.

---

## Table of Contents

1. [Scope and non-goals](#1-scope-and-non-goals)
2. [Architecture decisions](#2-architecture-decisions)
3. [Database schema](#3-database-schema)
4. [Type definitions](#4-type-definitions)
5. [Routes and auth guards](#5-routes-and-auth-guards)
6. [Plan limits](#6-plan-limits)
7. [UI patterns](#7-ui-patterns)
8. [Phase S1 — Supabase setup + types + auth](#phase-s1)
9. [Phase S2 — Email + password login + auth callback + route guards](#phase-s2)
10. [Phase S3 — Cloud project repository + remote save](#phase-s3)
11. [Phase S4 — Dashboard route + project list + thumbnails](#phase-s4)
12. [Phase S5 — Save flow, promotion, autosave to cloud](#phase-s5)
13. [Phase S6 — Plan enforcement + upgrade prompts](#phase-s6)
14. [Phase S7 — Stripe Checkout + webhooks](#phase-s7)
15. [Phase S8 — Account settings + billing portal](#phase-s8)
16. [Phase S9 — Project ownership operations](#phase-s9)
17. [Phase S10 — Templates + onboarding greeter](#phase-s10)

---

## 1. Scope and non-goals

### In scope

- Supabase Cloud Pro tier as the backend (Postgres + Auth + Storage + Edge Functions)
- Email + password auth (no OAuth at launch). Email confirmation disabled — users get instant access.
- **Note for operators**: Email confirmation must be disabled in the Supabase dashboard: Auth → Providers → Email → uncheck "Confirm email". This setting is not in version control.
- Anonymous editor use (current behaviour preserved); auth required only to save to cloud
- Cloud projects: store ProjectData in Postgres JSONB, media blobs in Supabase Storage
- Local→cloud project promotion on first save
- Autosave to cloud after first save, with optimistic concurrency control
- Lite version history: snapshot every 5 min while dirty, keep last 10, no UI yet
- Free plan: 3 projects, 1GB storage, video allowed (counts toward limit)
- Pro plan: unlimited projects, 10GB storage
- Pricing: $5/mo or $40/yr (33% off annual), Stripe Checkout
- Dashboard: project list, thumbnails, rename/delete/duplicate, soft-delete trash with 30-day auto-purge
- Account settings: display name, avatar, email change, notification prefs UI, delete account
- Project ownership: rename, delete, restore from trash, transfer ownership (with accept flow)
- Onboarding: skippable first-visit greeter modal in /app
- Templates: 1–2 starter templates, dashboard-only

### Out of scope at launch (explicitly)

- Edit collaboration (multi-user editing, presence, real-time sync) — v1.1
- Read-only share links — v1.05 follow-up
- OAuth providers (Google, GitHub) — possible later
- Custom emails (welcome, etc.) — Supabase + Stripe handle all transactional email
- Realtime conflict detection / presence — replaced by optimistic concurrency on save
- CRDT / Yjs / operational transform — not needed without edit collaboration
- Team / workspace plans
- Public profile pages, community, gallery
- Template library beyond 1–2 starter examples

### Definition of "complete"

A user can: visit loopa.app, try the editor anonymously, sign up with email + password, save their work, see a dashboard, manage their projects, hit a plan limit, upgrade to Pro via Stripe, manage their subscription, transfer or delete a project. Everything ships server-side enforced. Nothing relies on browser-side honour-system limits.

---

## 2. Architecture decisions

### Repository pattern, extended

Today: `LocalProjectRepo` (localStorage) and `IDBMediaRepo` (IndexedDB). New impls under the same interfaces:

```
core/persistence/
├── ProjectRepository.ts       # interface (existing)
├── MediaRepository.ts         # interface (existing)
├── LocalProjectRepo.ts        # existing
├── IDBMediaRepo.ts            # existing
├── RemoteProjectRepo.ts       # NEW — Supabase implementation
└── RemoteMediaRepo.ts         # NEW — Supabase Storage implementation
```

The document store decides which repo to use based on the project's location: anonymous/local → `LocalProjectRepo`, authenticated cloud project → `RemoteProjectRepo`. Stores still never touch storage APIs directly.

### Auth state lives in a new Pinia store

`useAuthStore` is the eighth Pinia store. It exposes:

```ts
{
  user:    Ref<User | null>          // null when logged out
  profile: Ref<UserProfile | null>   // app-level profile (display name, plan)
  status:  Ref<'loading' | 'anonymous' | 'authenticated'>
  isLoaded: ComputedRef<boolean>     // true after initial session check
  signIn(email: string): Promise<{ ok: boolean; error?: string }>
  signOut(): Promise<void>
  refresh(): Promise<void>
}
```

Initialized in `main.ts` *before* the router mounts, so guards can rely on `status`.

### Document store gets a "location" concept

`useDocumentStore` adds:

```ts
location: 'none' | 'local' | 'cloud'   // none = no project loaded
projectId: string | null               // UUID for cloud, local-id for local
isDirty: Ref<boolean>                  // mutated by any document change, cleared on successful save
saveStatus: Ref<'clean' | 'dirty' | 'saving' | 'saved' | 'conflict' | 'error'>
lastServerVersion: number | null       // for optimistic concurrency
```

Routing-level lifecycle (route remount on slug change) keeps this clean: navigating to `/app/:slug` initializes a cloud-loaded document; navigating to `/app` (no slug) initializes anonymous local.

### Editor remounts on project change

Vue Router's component `key` is bound to the route param. When `:slug` changes, the editor view unmounts and mounts fresh. All Pinia stores call `$reset()` in the editor view's `onUnmounted` hook. No live document swap.

### Optimistic concurrency, no Realtime

Every project row carries a `version` integer. Loads return the version; saves include the version they're updating from. Server rejects the update if `current_version != provided_version` and returns the latest. The client surfaces a "Conflict — review" state instead of overwriting silently. No subscriptions, no presence.

### Plan enforcement: server is authoritative, client is informative

Postgres functions / RLS policies / Edge Function checks reject any operation that would exceed plan limits. The client UI also knows the user's plan and disables/grays out actions that would exceed it, with explanatory tooltips. The server check is the safety net; the client check is the UX.

### Slugs in URLs, UUIDs in DB

Every project has a UUID primary key (cheap to migrate, never collides) and a separate `slug` column (8-char nanoid). URLs use the slug. Lookups happen by slug. UUIDs never appear in URLs.

### Hard architectural rules for backend code

These extend CLAUDE.md, scoped to backend integration:

1. **No direct `supabase.from(...)` calls in stores or components.** All Supabase access goes through repositories or composables. Stores import composables; composables import the Supabase client.
2. **Single Supabase client instance.** Lives in `src/core/supabase/client.ts`. Imported wherever needed. No re-instantiation.
3. **Auth state initialized before router.** `main.ts` awaits `useAuthStore().refresh()` before `app.mount()`.
4. **All cloud writes are versioned.** Saves include `expectedVersion`; server-side function rejects on mismatch.
5. **No new event bus.** Auth state changes propagate via Pinia reactivity; route-level lifecycle handles document reload.
6. **Server-side plan enforcement is mandatory.** Every limited operation goes through a Postgres function that checks limits. Frontend disables UI for the same limits but never assumes the backend won't.
7. **Use existing UI primitives.** `Modal`, `Button`, `Select`, `NumberField`, `Toggle`, `IconButton`, `InspectorRow`, etc. Don't hand-roll. Don't introduce new design tokens.
8. **Dashboard, account, login pages share a layout.** New `AppShell.vue` (different from `EditorShell.vue`) provides the topbar/navigation for non-editor authenticated routes.

---

## 3. Database schema

```sql
-- Users (Supabase Auth manages auth.users; we store app profile separately)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  plan          text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id   text,
  stripe_subscription_id text,
  subscription_status  text,                       -- 'active', 'canceled', 'past_due', null
  subscription_period_end timestamptz,             -- when canceled subs lose pro
  notification_prefs   jsonb not null default '{}'::jsonb,
  storage_used_bytes bigint not null default 0,    -- denormalized; recalculated by trigger
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Projects
create table projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,              -- 8-char nanoid
  owner_id      uuid not null references profiles(id) on delete cascade,
  name          text not null default 'Untitled',
  data          jsonb not null,                    -- ProjectData (frames, elements, tracks, motionPaths, schemaVersion)
  thumbnail_url text,                              -- Supabase Storage URL
  version       integer not null default 1,        -- optimistic concurrency
  storage_used_bytes bigint not null default 0,    -- size of associated media for this project
  trashed_at    timestamptz,                       -- non-null = soft-deleted
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index projects_owner_id_idx       on projects(owner_id) where trashed_at is null;
create index projects_owner_trashed_idx  on projects(owner_id) where trashed_at is not null;

-- Project version snapshots (lite history)
create table project_versions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  data          jsonb not null,
  version       integer not null,                  -- the version this snapshot represents
  created_at    timestamptz not null default now()
);

create index project_versions_project_id_created_idx
  on project_versions(project_id, created_at desc);

-- Project media (images, videos)
create table project_media (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  storage_id    text not null unique,              -- key in Supabase Storage bucket
  size_bytes    bigint not null,
  mime_type     text not null,
  created_at    timestamptz not null default now()
);

create index project_media_project_id_idx on project_media(project_id);

-- Ownership transfers (pending acceptance)
create table ownership_transfers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  from_user_id  uuid not null references profiles(id),
  to_user_id    uuid not null references profiles(id),
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);
```

### Row-Level Security (mandatory)

Every table has RLS enabled. Policies:

- `profiles`: user can select/update their own row only. Insert via auth trigger.
- `projects`: owner can select/update/delete their own non-trashed rows. Trashed rows visible only via explicit "trash" query.
- `project_versions`: readable by project owner only.
- `project_media`: readable/writable by project owner only.
- `ownership_transfers`: readable by from_user or to_user. Updatable only by to_user (to accept/decline) or from_user (to cancel).

### Triggers

- `profiles_insert_on_auth_user`: trigger on `auth.users` insert creates a matching `profiles` row.
- `projects_updated_at`: auto-update `updated_at` on every update.
- `project_media_size_aggregate`: maintains `projects.storage_used_bytes` and `profiles.storage_used_bytes` on insert/delete.
- `auto_purge_trashed_projects`: scheduled (pg_cron) daily, deletes projects where `trashed_at < now() - interval '30 days'`.
- `prune_old_versions`: on `project_versions` insert, deletes oldest versions for that project beyond the 10-most-recent.

### Postgres functions for plan-limited operations

Server-authoritative checks. The client calls these via RPC or via Edge Functions:

```sql
-- Returns the new project ID, or raises exception if limit hit
create function create_project(name text, data jsonb) returns uuid
  language plpgsql security definer ...

-- Returns the new version, or raises exception on conflict
create function update_project(project_id uuid, data jsonb, expected_version int) returns int ...

-- Returns true if media can be added (storage budget check)
create function check_media_quota(project_id uuid, size_bytes bigint) returns boolean ...
```

These functions enforce: free user max 3 active projects, free user max 1GB storage, pro user max 10GB storage, version match for updates. The client handles thrown exceptions as user-facing errors.

### Storage buckets

- `media` (private): user-uploaded images and videos. Path: `{user_id}/{project_id}/{storage_id}`.
- `thumbnails` (public-read): project thumbnails. Path: `{user_id}/{project_id}.png`.

---

## 4. Type definitions

Place in `src/types/auth.ts` and `src/types/cloud.ts`. Pure types — no value imports.

```ts
// src/types/auth.ts

export interface User {
  id:    string
  email: string
}

export type Plan = 'free' | 'pro'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | null

export interface UserProfile {
  id:                     string
  displayName:            string | null
  avatarUrl:              string | null
  plan:                   Plan
  subscriptionStatus:     SubscriptionStatus
  subscriptionPeriodEnd:  number | null   // ms timestamp
  storageUsedBytes:       number
  notificationPrefs:      Record<string, boolean>
}

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'
```

```ts
// src/types/cloud.ts

import type { ProjectData } from './project'

export interface CloudProjectMeta {
  id:               string             // UUID, not used in URLs
  slug:             string             // 8-char nanoid, used in URLs
  ownerId:          string
  name:             string
  thumbnailUrl:     string | null
  version:          number
  storageUsedBytes: number
  trashedAt:        number | null
  createdAt:        number
  updatedAt:        number
}

export interface CloudProject {
  meta: CloudProjectMeta
  data: ProjectData
}

export type SaveStatus =
  | 'clean'                  // matches server
  | 'dirty'                  // local changes pending save
  | 'saving'                 // save in flight
  | 'saved'                  // just saved (transient, returns to clean)
  | 'conflict'               // server has newer version, awaiting user action
  | 'error'                  // last save errored

export type DocumentLocation =
  | 'none'                   // no project loaded
  | 'local'                  // anonymous, IndexedDB only
  | 'cloud'                  // saved to cloud, has projectId

export interface OwnershipTransfer {
  id:           string
  projectId:    string
  projectName:  string
  fromUserId:   string
  fromEmail:    string
  toUserId:     string
  status:       'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
  expiresAt:    number
  createdAt:    number
}
```

---

## 5. Routes and auth guards

```
/                       Landing                          [public]
/login                  Email + password login           [public]
/auth/reset             Password reset                   [public]
/auth/callback          Auth callback                    [public]
/dashboard              Project list                     [auth required]
/dashboard/trash        Soft-deleted projects            [auth required]
/account                Settings, billing, danger zone   [auth required]
/app                    Editor, anonymous local doc      [public]
/app/:slug              Editor, cloud project            [auth required]
```

### Route-level behaviours

- **Auth-required routes**: if `useAuthStore().status === 'anonymous'`, redirect to `/login` with `redirect=` query param.
- **`/login` while authenticated**: redirect to `/dashboard`.
- **`/auth/callback`**: reads the auth token from the URL, calls `supabase.auth.exchangeCodeForSession`, then:
  1. If localStorage has `loopa.pendingPromotion`, promote that local project to cloud and redirect to `/app/:slug`.
  2. Else if URL has `?redirect=`, redirect there.
  3. Else redirect to `/dashboard`.
- **`/app/:slug`**: editor view receives `slug` as a route param, fetches project on mount, on slug change Vue Router remounts the view (`<RouterView v-slot="{ Component, route }"><component :is="Component" :key="route.params.slug" /></RouterView>`).
- **`/app` (no slug)**: editor in anonymous-local mode. Uses existing `LocalProjectRepo` flow. The "Save" button promotes to cloud (which means navigating to auth, then to `/app/:slug`).

### Layouts

- `AppShell.vue` (new): topbar with logo, "Dashboard" link, user menu (avatar/email, settings, sign out). Wraps `/dashboard`, `/dashboard/trash`, `/account`.
- `EditorShell.vue` (existing): unchanged structure. Topbar gets new Save button + user menu.
- Landing and `/login` use no shell.

---

## 6. Plan limits

| Limit                 | Free            | Pro              | Enforced by                          |
|-----------------------|-----------------|------------------|--------------------------------------|
| Active projects       | 3               | unlimited        | `create_project` SQL function       |
| Storage               | 1 GB            | 10 GB            | `check_media_quota` SQL function    |
| Frames per project    | unlimited       | unlimited        | n/a                                  |
| Project size (JSON)   | 5 MB            | 50 MB            | `update_project` SQL function       |
| Version snapshots     | 10 most recent  | 10 most recent   | `prune_old_versions` trigger        |

### Limit-hit UX

| Trigger                            | Behaviour                                                                  |
|------------------------------------|----------------------------------------------------------------------------|
| Free at project limit, "Save"      | Block save, show upgrade modal: "You've used all 3 free projects."         |
| Free at project limit, "New" in dashboard | Disable button, tooltip: "Upgrade to Pro for unlimited projects."   |
| Free over storage budget on upload | Block upload, modal: "This file would exceed your 1GB storage limit."     |
| Pro→Free downgrade with >3 projects | All projects become read-only; "New project" disabled; banner explains.   |
| Pro storage exceeded               | Block new uploads only; existing content untouched.                       |

---

## 7. UI patterns

### Topbar Save button (editor)

Replaces the current save-status text in the centre of `EditorTopbar.vue` with a state-driven control:

| Document state              | Render                                                          |
|-----------------------------|-----------------------------------------------------------------|
| Anonymous local, dirty      | `[Save]` primary button                                         |
| Cloud, clean                | `Saved · 2 min ago` muted text                                  |
| Cloud, dirty                | `Saving…` muted text (during debounce)                         |
| Cloud, saving               | `Saving…` muted text                                            |
| Cloud, saved                | `Saved` muted text, fades to "Saved 2 min ago" after 2s         |
| Cloud, conflict             | `Conflict — review` warning button                              |
| Cloud, error                | `Save failed — retry` danger button                             |

### Conflict modal

When `saveStatus === 'conflict'`, clicking the conflict button opens a modal with three actions: "Reload server version (lose my changes)", "Overwrite server (lose remote changes)", "Cancel and keep editing". No automatic merge.

### Dashboard layout

`AppShell` wrap. Body:

- Header row: "Projects" h1 + `[New project]` primary button (disabled at limit, tooltip if so) + view toggle (grid/list) + search input.
- Grid of project cards (default view): thumbnail, name, last edited, context menu (rename, duplicate, transfer, move to trash).
- Empty state (zero projects): centred copy "No projects yet" + `[New project]` primary + below that, a row of 1–2 template tiles ("Start from a template").
- "Trash" link in `AppShell` user menu, badge if non-empty.

### Account page sections

Single-column form layout, each section in an `InspectorSection` (reuse the primitive):

1. **Profile** — display name (TextField), avatar upload (file picker → Supabase Storage), email (read-only with "Change email" action).
2. **Plan** — current plan badge, storage usage bar (used / limit), `[Upgrade to Pro]` or `[Manage subscription]` (opens Stripe Customer Portal).
3. **Notifications** — toggles for: project transfer requests, billing receipts (read-only, can't disable transactional). All disabled by default at launch since no notifications exist yet beyond transactional.
4. **Danger zone** — `[Delete account]` button, confirmation modal requires typing email.

### Login page

Centered card. "Welcome to Loopa" heading. Tabbed AuthForm: "Sign in" tab (email + password, "Forgot password?" link) and "Sign up" tab (email + password, "12+ characters" hint). Submit: "Sign in" or "Create account". "Forgot password?" calls requestPasswordReset and swaps form for "Check your email — reset link sent." On success, auth listener redirects. No OAuth at launch.

### First-visit greeter modal

Triggered on `/app` if `localStorage['loopa.welcomed']` is unset. Modal content:

- Headline: "Welcome to Loopa"
- One sentence: what Loopa is.
- Three rows: "Press R for rectangles", "Press P for the pen tool", "Press Space + drag to pan".
- `[Got it]` primary button — sets `loopa.welcomed = '1'` and closes.
- Subtext: "You can revisit shortcuts anytime with `?`."

Never reappears after first dismissal.

---

<a name="phase-s1"></a>
## Phase S1 — Supabase setup + types + auth store

**Goal**: Supabase project provisioned, schema applied, types defined, auth store working but not yet wired to UI. Build still passes; nothing user-visible.

### Files in scope

May create:
- `src/core/supabase/client.ts`
- `src/core/supabase/types.ts` (generated types from Supabase CLI, or hand-rolled)
- `src/types/auth.ts`
- `src/types/cloud.ts`
- `src/stores/useAuthStore.ts`
- `supabase/migrations/0001_init.sql`

May modify:
- `src/main.ts` (add auth init before router mount)
- `package.json` (add `@supabase/supabase-js`)
- `.env.example` (add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

Do NOT touch: any other file.

### Tasks

- Create the Supabase project. Apply the schema from §3 as `supabase/migrations/0001_init.sql`. Enable RLS. Create the storage buckets.
- `client.ts` exports a single `supabase` client instance using env vars. Document required env vars in `.env.example`.
- `useAuthStore`: per §2. `refresh()` reads the session from supabase and populates `user` and `profile`. `signIn(email, password)` calls `supabase.auth.signInWithPassword`. `signUp(email, password)` calls `supabase.auth.signUp`. `requestPasswordReset(email)` sends a reset email. `updatePassword(newPassword)` updates the password after reset. `signOut()` clears session. Subscribes to `onAuthStateChange` to keep state in sync.
- `main.ts` awaits `useAuthStore().refresh()` before `app.mount()`. Use `createPinia()` first, then `await refresh()`, then mount.

### Done when

- `pnpm dev` starts cleanly with valid env vars.
- Calling `useAuthStore().signIn('test@example.com', 'password123')` returns `{ ok: true }` for an existing user (auth state updates visibly in `useAuthStore().status`).
- No UI changes yet. Editor still works exactly as before.
- No file outside the in-scope list has been modified.

---

<a name="phase-s2"></a>
## Phase S2 — Login route + auth callback + route guards

**Goal**: Working `/login` page, email + password auth end-to-end, password reset flow, auth-protected routes redirect correctly. Still no dashboard or save flow.

### Files in scope

May create:
- `src/views/LoginView.vue`
- `src/views/AuthCallbackView.vue`
- `src/features/auth/AuthForm.vue`
- `src/features/auth/PasswordResetForm.vue`
- `src/views/PasswordResetView.vue`
- `src/features/auth/AuthCard.vue`

May modify:
- `src/router/index.ts` (add `/login`, `/auth/callback`, route guard)

Do NOT touch: any other file.

### Tasks

- `LoginView` renders `AuthCard` containing `AuthForm`. Tabbed sign-in / sign-up. Shows success banner when `?reset=success` is in the query string.
- `AuthForm`: email + password with mode toggle. Sign-in calls `signIn(email, password)`; sign-up calls `signUp(email, password)`. "Forgot password?" link calls `requestPasswordReset`; on success swaps for "Check your email" state. 12-char minimum on sign-up.
- `PasswordResetView` wraps `AuthCard` + `PasswordResetForm`. Accessible at `/auth/reset`.
- `PasswordResetForm`: new password + confirm fields. On submit: `updatePassword(password)`, sign out, navigate to `/login?reset=success`.
- `AuthCallbackView`: on mount, exchange the code for a session, await `useAuthStore().refresh()`, then redirect per §5. Handle errors (expired token, etc.) with a clear message + "Try again" link to `/login`.
- Router guard: `beforeEach` checks if route requires auth; if so and user is anonymous, redirect to `/login?redirect=<path>`. If user is authenticated and going to `/login`, redirect to `/dashboard`.
- The promotion path is stubbed for now (just redirect to `/dashboard`); real promotion lands in S5.

### Done when

- Visiting `/login`, entering email + password, signing in, lands on `/dashboard` (which 404s for now — that's fine).
- Visiting `/login`, signing up with email + password (12+ chars), lands on `/dashboard` with no email confirmation step.
- Clicking "Forgot password?", receiving reset email, clicking the link, landing on `/auth/reset`, setting new password, returning to `/login` with success message.
- Visiting `/dashboard` while logged out redirects to `/login`.
- Visiting `/login` while logged in redirects to `/dashboard`.
- Editor at `/app` continues to work for anonymous users.
- No file outside the in-scope list has been modified.

---

<a name="phase-s3"></a>
## Phase S3 — Cloud project repository + remote save

**Goal**: `RemoteProjectRepo` and `RemoteMediaRepo` implementations work. A test project can be created, saved, and loaded from cloud via console. No UI wired yet.

### Files in scope

May create:
- `src/core/persistence/RemoteProjectRepo.ts`
- `src/core/persistence/RemoteMediaRepo.ts`
- `src/core/supabase/queries.ts` (typed query helpers)
- `src/core/utils/slug.ts` (nanoid wrapper for project slugs)

May modify:
- `src/core/persistence/ProjectRepository.ts` (extend interface if needed for versioning)

Do NOT touch: any other file.

### Tasks

- `RemoteProjectRepo` implements the existing `ProjectRepository` interface plus version-aware methods:
  - `list(): Promise<CloudProjectMeta[]>`
  - `loadBySlug(slug: string): Promise<CloudProject | null>`
  - `create(name: string, data: ProjectData): Promise<CloudProject>` (calls `create_project` RPC)
  - `update(id: string, data: ProjectData, expectedVersion: number): Promise<{ version: number } | { conflict: true; serverVersion: number }>`
  - `softDelete(id: string)`, `restore(id: string)`, `hardDelete(id: string)`
  - `transferOwnership(id: string, toEmail: string): Promise<OwnershipTransfer>`
- `RemoteMediaRepo` implements the existing `MediaRepository` interface against Supabase Storage `media` bucket. Honours the path scheme `{user_id}/{project_id}/{storage_id}`.
- `slug.ts` wraps `nanoid(8)` for URL-safe slugs.
- All queries use proper typing — no `as any`. Generate types from the schema via Supabase CLI or hand-roll matching the §3 tables.

### Done when

- From the browser console, you can create a project, list projects, load a project by slug, update with version check (and see conflict on stale version), and soft-delete.
- Plan-limit exceptions thrown by `create_project` surface as typed errors from the repo.
- No UI changes yet. Build and types pass.

---

<a name="phase-s4"></a>
## Phase S4 — Dashboard route + project list + thumbnails

**Goal**: A working dashboard. User can see their projects, open one, hit the New Project button (which creates an empty cloud project and navigates to it). Thumbnails render. Empty state works.

### Files in scope

May create:
- `src/layout/AppShell.vue`
- `src/layout/AppTopbar.vue`
- `src/features/dashboard/DashboardView.vue` → wait, views go in `src/views/`. Use:
- `src/views/DashboardView.vue`
- `src/views/TrashView.vue`
- `src/features/dashboard/ProjectGrid.vue`
- `src/features/dashboard/ProjectCard.vue`
- `src/features/dashboard/ProjectContextMenu.vue`
- `src/features/dashboard/EmptyDashboard.vue`
- `src/features/dashboard/UserMenu.vue`
- `src/composables/useProjects.ts` (list/refresh, calls `RemoteProjectRepo`)

May modify:
- `src/router/index.ts` (add `/dashboard`, `/dashboard/trash`)
- `src/composables/useThumbnail.ts` (add `uploadThumbnail` to push to Supabase Storage; existing local generation untouched)

Do NOT touch: editor files, document store, `EditorTopbar.vue`, etc.

### Tasks

- `AppShell` provides the chrome for non-editor authenticated routes: 44px topbar identical in dimensions to `EditorShell`'s topbar but with logo/Dashboard link/user menu instead of editor controls.
- `DashboardView` lists projects via `useProjects`. Grid view by default (4 cols desktop, 2 mobile). Each card shows: thumbnail (or placeholder if `null`), name, last edited.
- `ProjectCard` click: navigate to `/app/:slug`.
- `ProjectContextMenu`: rename (inline), duplicate (creates new project with copy of data), transfer ownership (opens transfer dialog — flow lands in S9, this phase shows "Coming soon" toast on click), move to trash.
- `EmptyDashboard`: rendered when `projects.length === 0`. Per §7.
- `[New project]` button: calls `RemoteProjectRepo.create()` with empty `ProjectData`, navigates to `/app/:newSlug`. Disabled when at plan limit (S6 enforces; here just call and let server reject with toast for now).
- `useThumbnail.uploadThumbnail(projectId, dataUri)`: uploads PNG to `thumbnails` bucket, returns the public URL. Updates `projects.thumbnail_url` row. Called from S5 autosave; here just exposed.

### Done when

- Logged in, navigate to `/dashboard`, see your projects (or the empty state).
- Clicking "New project" creates a project, navigates to editor, project loads (editor still uses local logic — that's S5).
- Right-clicking a project shows the context menu; rename works inline; trash works (project disappears from grid, appears in `/dashboard/trash`).
- Trash view lists trashed projects with restore + permanent delete actions.
- All copy is in tone with the rest of the app (terse, no emojis).

---

<a name="phase-s5"></a>
## Phase S5 — Save flow, promotion, autosave to cloud

**Goal**: The editor knows whether it's anonymous-local or cloud-attached, has a working Save button, autosaves to cloud after first save, handles conflicts.

### Files in scope

May create:
- `src/composables/useSaveOrchestrator.ts` (the central save logic)
- `src/features/editor/SaveButton.vue`
- `src/features/editor/ConflictModal.vue`
- `src/features/editor/SaveStatusIndicator.vue`

May modify:
- `src/stores/useDocumentStore.ts` (add `location`, `projectId`, `slug`, `isDirty`, `saveStatus`, `lastServerVersion`, methods to load from cloud and to mark dirty)
- `src/composables/useAutosave.ts` (route saves through `useSaveOrchestrator`, no longer call `doc.saveProject()` directly)
- `src/layout/EditorTopbar.vue` (replace static save status with `SaveStatusIndicator` and `SaveButton`)
- `src/views/EditorView.vue` (load by slug if route param exists; reset stores on remount)
- `src/router/index.ts` (route remount key by `:slug`)
- `src/views/AuthCallbackView.vue` (real promotion logic per §5)

Do NOT touch: any other file.

### Tasks

- Document store: every mutating action sets `isDirty = true`. Successful save sets `isDirty = false`, `saveStatus = 'saved'`, then `'clean'` after 2s.
- `useSaveOrchestrator`:
  - `saveNow()`: if local-only with no auth, set `pendingPromotion = serialize()` in localStorage and navigate to `/login?redirect=/dashboard`. Else (cloud), call `RemoteProjectRepo.update(id, data, expectedVersion)`. On conflict, set `saveStatus = 'conflict'`. On error, set `'error'`.
  - `promoteLocalToCloud()`: called from auth callback. Reads `pendingPromotion` from localStorage, calls `RemoteProjectRepo.create()`, returns the new slug for redirect. Clears `pendingPromotion`.
  - Autosave: debounced 2s after last document mutation, only when `location === 'cloud'` and `isDirty`. Uses snapshot version protocol.
- `SaveButton`: shown only when `location === 'local'` and `isDirty`. Click → `saveOrchestrator.saveNow()`.
- `SaveStatusIndicator`: renders the table from §7.
- `ConflictModal`: three buttons per §7. "Reload server" calls `loadFromCloud(slug)`. "Overwrite" calls `update` with `expectedVersion = serverVersion` (forces success).
- `EditorView`: if route has `:slug`, on mount calls `useDocumentStore().loadFromCloud(slug)` (which uses `RemoteProjectRepo.loadBySlug`). On unmount (remount on slug change), calls `$reset()` on all editor stores. If no `:slug`, anonymous-local mode (existing path).
- Version snapshot to `project_versions` is server-side via Postgres trigger or function — no client work needed beyond ensuring the `update_project` RPC includes the snapshot logic.

### Done when

- Anonymous user opens `/app`, draws something, clicks Save → goes to `/login`, signs in, returns to `/app/:newSlug` with their project loaded and saved.
- Logged-in user with cloud project edits, autosave fires within ~2s after last edit, status shows "Saving…" then "Saved".
- Open same project in two tabs, edit in tab A, save, edit in tab B, save → conflict modal in tab B with three actions, all working.
- Free user at 3 projects clicking Save while anonymous → after auth, server rejects creation, friendly error returns user to `/app` with their local doc intact and an upgrade prompt.

---

<a name="phase-s6"></a>
## Phase S6 — Plan enforcement + upgrade prompts

**Goal**: Every plan limit is enforced both server-side and surfaced clearly client-side. Free users hit walls with explanatory upgrade prompts, never silent failures.

### Files in scope

May create:
- `src/composables/usePlanLimits.ts` (reactive computed limits based on user profile)
- `src/features/upgrade/UpgradeModal.vue`
- `src/features/upgrade/StorageUsageBar.vue`

May modify:
- `src/composables/useAddMedia.ts` (check storage quota before upload)
- `src/features/dashboard/EmptyDashboard.vue`, `ProjectGrid.vue` (disable New Project at limit)
- `src/composables/useSaveOrchestrator.ts` (catch limit-exceeded errors, show `UpgradeModal`)
- `src/views/EditorView.vue` (storage bar in topbar? optional; leave as composable consumed where useful)

Do NOT touch: stores, repositories.

### Tasks

- `usePlanLimits`: reactive computed values for `projectLimit`, `storageLimit`, `projectsRemaining`, `storageRemaining`, `atProjectLimit`, `atStorageLimit`, derived from `useAuthStore().profile`.
- `UpgradeModal`: triggered by limit-exceeded errors. Headline ("You've used all 3 free projects"), feature comparison table, `[Upgrade to Pro — $5/mo]` primary button (S7 wires the actual checkout), `[Maybe later]` ghost button.
- `StorageUsageBar`: small horizontal bar `used / limit GB`, color shifts to warning above 80%, danger above 100%.
- `useAddMedia`: before calling `IDBMediaRepo.put`, if location is cloud, check `usePlanLimits().storageRemaining >= file.size`. If not, show `UpgradeModal` with storage variant.
- New Project button across dashboard: `disabled` when `atProjectLimit`. Tooltip: "Upgrade to Pro for unlimited projects."

### Done when

- Free user with 3 projects: New Project button disabled with tooltip; trying to save a 4th from anon→cloud promotion shows the upgrade modal.
- Free user uploading a video that would exceed 1GB: blocked, modal explains.
- Storage bar appears in account page (S8 builds the page; here just wire the component for use).
- Pro user: no limits visible, all buttons enabled.

---

<a name="phase-s7"></a>
## Phase S7 — Stripe Checkout + webhooks

**Goal**: Users can upgrade to Pro via Stripe Checkout. Webhooks update profile.plan and subscription fields. Cancellation works.

### Files in scope

May create:
- `supabase/functions/stripe-checkout/index.ts` (Edge Function: creates a Checkout session)
- `supabase/functions/stripe-webhook/index.ts` (Edge Function: receives Stripe events, updates profiles)
- `supabase/functions/stripe-portal/index.ts` (Edge Function: creates Customer Portal session for managing subscription)
- `src/composables/useBilling.ts`
- `supabase/migrations/0002_stripe_metadata.sql` (any additional indexes/columns if needed)

May modify:
- `src/features/upgrade/UpgradeModal.vue` (wire `[Upgrade]` button to `useBilling.startCheckout()`)
- `.env.example` (add `STRIPE_PUBLISHABLE_KEY`, document required Supabase function secrets)

Do NOT touch: any other file.

### Tasks

- Stripe dashboard setup: create a product "Loopa Pro" with two prices ($5/mo and $40/yr).
- `stripe-checkout` Edge Function: takes `priceId` from body, looks up or creates Stripe customer for the calling user, creates a Checkout Session with success URL `/account?checkout=success` and cancel URL `/account?checkout=cancel`. Returns the session URL.
- `stripe-webhook` Edge Function: handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Updates the user's `profiles` row with `plan`, `stripe_subscription_id`, `subscription_status`, `subscription_period_end`. Verifies signatures using `STRIPE_WEBHOOK_SECRET`.
- `stripe-portal` Edge Function: creates a Customer Portal session, returns URL.
- `useBilling`: `startCheckout(period: 'monthly' | 'yearly')`, `openCustomerPortal()`. Handles redirect.
- Pro→Free downgrade behaviour (per §6): on `customer.subscription.deleted` webhook, set `plan = 'free'`. The "all projects read-only until under limit" UX is enforced by `usePlanLimits` returning `atProjectLimit = true` when `plan === 'free' && activeProjectCount > 3` — the UI already disables editing in that case. Add a banner in the editor when this is true.

### Done when

- User on free plan clicks "Upgrade to Pro", goes through Stripe Checkout (test mode), returns to `/account?checkout=success`, sees their plan as Pro within ~5 seconds (webhook propagation).
- User on Pro plan opens Customer Portal, cancels subscription, after period end the webhook fires and they downgrade to Free.
- A downgraded user with 8 projects sees them all in dashboard but can't open them for editing (or can open but is read-only). New project disabled.

---

<a name="phase-s8"></a>
## Phase S8 — Account settings + billing portal

**Goal**: Working `/account` page with profile, plan, notifications (UI only, no behaviour at launch), and danger zone.

### Files in scope

May create:
- `src/views/AccountView.vue`
- `src/features/account/ProfileSection.vue`
- `src/features/account/PlanSection.vue`
- `src/features/account/NotificationsSection.vue`
- `src/features/account/DangerZoneSection.vue`
- `src/composables/useAccount.ts` (update profile, change email, delete account)

May modify:
- `src/router/index.ts` (add `/account`)

Do NOT touch: any other file.

### Tasks

- `ProfileSection`: display name (editable), avatar upload (calls Supabase Storage `avatars` bucket if you want — or reuse `media`; document the choice), email change (uses `supabase.auth.updateUser({ email })`, confirmation flow).
- `PlanSection`: shows current plan, `StorageUsageBar`, action buttons. Free user: `[Upgrade to Pro]`. Pro user: `[Manage subscription]` (opens Stripe portal). Pro user with cancellation pending: shows period end date.
- `NotificationsSection`: toggle list per §7. All disabled or read-only at launch. Copy explains "More notifications coming soon."
- `DangerZoneSection`: "Delete account" button → confirmation modal requires typing email. On confirm, calls a Postgres function that hard-deletes user data and revokes auth.

### Done when

- Visiting `/account` shows all four sections.
- Display name change persists and updates in `UserMenu` topbar.
- Avatar upload works.
- Plan section accurately reflects current plan and shows correct CTA.
- Delete account confirmation requires typing email exactly; on success, user is signed out and all their data is gone.

---

<a name="phase-s9"></a>
## Phase S9 — Project ownership operations

**Goal**: Transfer ownership end-to-end: invite, accept, decline, expire. Includes the email invite flow.

### Files in scope

May create:
- `src/features/dashboard/TransferOwnershipModal.vue`
- `src/features/dashboard/IncomingTransfersBanner.vue`
- `supabase/functions/send-transfer-email/index.ts` (uses Supabase's email integration)
- `src/composables/useOwnershipTransfers.ts`

May modify:
- `src/features/dashboard/ProjectContextMenu.vue` (replace "Coming soon" with real transfer flow)
- `src/views/DashboardView.vue` (add `IncomingTransfersBanner` at top)

Do NOT touch: any other file.

### Tasks

- `TransferOwnershipModal`: input for recipient email, confirmation copy ("This will transfer ownership of '{name}' to {email}. They have 7 days to accept."). Calls `RemoteProjectRepo.transferOwnership` which inserts into `ownership_transfers` and triggers `send-transfer-email`.
- `send-transfer-email` Edge Function: uses the standard Supabase email channel to send an email containing a `/dashboard?transfer=<id>` URL.
- `IncomingTransfersBanner`: shown when `useOwnershipTransfers().pending.length > 0`. Lists each: "User X wants to transfer 'Project Y' to you. [Accept] [Decline]".
- Accept flow: server-side function moves the project to the new owner, only succeeds if the new owner has a free project slot (free plan) — otherwise returns an error and the modal explains.
- Expiry: pg_cron daily job sets status to `expired` for transfers past `expires_at`.

### Done when

- User A initiates transfer to User B's email; User B receives email; clicking the link lands them on `/dashboard?transfer=<id>` with the banner and accept/decline buttons.
- Accept moves the project to User B's dashboard, removes from User A's.
- Decline keeps it with User A and notifies (UI only — no email at launch).
- A free user accepting a transfer that would put them over 3 projects sees a clear error.
- 7-day-old pending transfers auto-expire.

---

<a name="phase-s10"></a>
## Phase S10 — Templates + onboarding greeter

**Goal**: First-visit greeter modal works. Dashboard empty state shows 1–2 templates that create real projects when clicked.

### Files in scope

May create:
- `src/features/onboarding/WelcomeModal.vue`
- `src/features/dashboard/TemplateTile.vue`
- `src/core/templates/index.ts` (exports template definitions)
- `src/core/templates/animatedLogo.ts`
- `src/core/templates/loadingSpinner.ts`

May modify:
- `src/views/EditorView.vue` (mount `WelcomeModal` on first visit if no `localStorage['loopa.welcomed']`)
- `src/features/dashboard/EmptyDashboard.vue` (add template tiles row)

Do NOT touch: any other file.

### Tasks

- Templates are pre-built `ProjectData` objects exported from `src/core/templates/`. Each is a small, polished animation that demonstrates Loopa's strengths.
- `TemplateTile`: thumbnail (rendered statically by importing the template's first frame and rendering via the existing render primitive), name, click → creates a new project with the template's `ProjectData`, navigates to it.
- `WelcomeModal`: per §7. On dismiss, sets `localStorage['loopa.welcomed'] = '1'`. If the storage flag is already set, the modal never mounts.
- The "?" hint mentioned in the modal is just `useShortcuts`' existing shortcuts modal — already exists.

### Done when

- First visit to `/app` shows the welcome modal once. Dismissing it persists. Reload doesn't re-show.
- Empty `/dashboard` shows 1–2 template tiles in addition to the "New project" button.
- Clicking a template creates a project with that template's content and opens it for editing.
- Template projects are real `CloudProject`s once saved — no special-casing in the document model.

---

## How to use this document with Claude Code

1. Place this file as `SUPABASE.md` next to `CLAUDE.md`, `REBUILD.md`, and `EXPORT.md` at the repo root.
2. Start a Claude Code session: *"Read CLAUDE.md, EXPORT.md, then SUPABASE.md. Confirm by summarizing the ten phases in one line each. Do not write any code yet."*
3. After verification: *"Start Phase S1. The 'Files in scope' section is binding — do not create or modify any file outside that list. If a needed change falls outside scope, stop and ask. Stop when 'done when' criteria are met."*
4. Review and commit between every phase. Verify the "files outside scope are untouched" rule by `git status` before commit.
5. The S1–S2 phases are foundational and independent. S3 unlocks S4. S5 needs S3 and S4. S6 needs S5. S7 is independent of S6 but shares the upgrade modal. S8 needs S7. S9 and S10 are independent.

## Verification before each phase merges

A quick checklist Claude Code should run before declaring a phase complete:

- `pnpm build` passes (typecheck + Vite build)
- `pnpm lint` passes
- No file in the repo exceeds the size budget from CLAUDE.md
- `grep -rn "as any\|as never" src/` returns nothing new
- `git diff --stat` only shows files in the phase's "in scope" list