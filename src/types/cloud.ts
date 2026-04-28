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
