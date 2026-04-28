// ── Format identity ──────────────────────────────────────────────────────────

export type ExportFormat = 'lottie' | 'png-sequence' | 'gif' | 'mp4' | 'webm'

// ── Per-format options ───────────────────────────────────────────────────────

export interface LottieOptions {
  format: 'lottie'
  prettyPrint: boolean
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
  code: string
  message: string
  elementId?: string
  elementName?: string
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
  frameId: string
  status: ExportJobStatus
  preflight: PreflightReport | null
  progress: number                  // 0..1
  currentFrame: number
  totalFrames: number
  error: string | null
  result: Blob | null
  resultFileName: string | null
}

// ── Render primitive output ──────────────────────────────────────────────────

export interface MediaLayer {
  type: 'video'
  elementId: string
  blobUrl: string
  time: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fit: 'cover' | 'contain' | 'fill'
}

export interface RenderedFrame {
  svg: string
  media: MediaLayer[]
  width: number
  height: number
  backgroundColor: string
}


