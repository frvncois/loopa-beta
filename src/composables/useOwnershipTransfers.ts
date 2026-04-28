import { ref } from 'vue'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/core/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { OwnershipTransfer } from '@/types/cloud'

// ── Module-level singletons ───────────────────────────────────────────────────

const _pending       = ref<OwnershipTransfer[]>([])
const _loading       = ref(false)
const _transferModal = ref<{ projectId: string; projectName: string } | null>(null)

// ── Local types ───────────────────────────────────────────────────────────────

type TransferRow = {
  id: string
  project_id: string
  from_user_id: string
  to_user_id: string
  status: string
  expires_at: string
  created_at: string
  project: { name: string } | null
  sender:  { display_name: string | null } | null
}

function rowToTransfer(row: TransferRow): OwnershipTransfer {
  return {
    id:          row.id,
    projectId:   row.project_id,
    projectName: row.project?.name ?? '',
    fromUserId:  row.from_user_id,
    fromEmail:   row.sender?.display_name ?? '',
    toUserId:    row.to_user_id,
    status:      row.status as OwnershipTransfer['status'],
    expiresAt:   new Date(row.expires_at).getTime(),
    createdAt:   new Date(row.created_at).getTime(),
  }
}

// ── Error extraction ──────────────────────────────────────────────────────────

async function extractError(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const body = await err.context.json() as { error?: string }
      if (body.error) return body.error
    } catch { /* fall through */ }
  }
  return err instanceof Error ? err.message : 'Unknown error'
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useOwnershipTransfers() {
  const auth = useAuthStore()

  async function loadPending(): Promise<void> {
    if (!auth.user) return
    _loading.value = true
    try {
      const { data, error } = await supabase
        .from('ownership_transfers')
        .select(`
          id, project_id, from_user_id, to_user_id, status, expires_at, created_at,
          project:projects!project_id(name),
          sender:profiles!from_user_id(display_name)
        `)
        .eq('to_user_id', auth.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (!error && data) {
        _pending.value = (data as unknown as TransferRow[]).map(rowToTransfer)
      }
    } finally {
      _loading.value = false
    }
  }

  async function initiateTransfer(
    projectId: string,
    toEmail: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.functions.invoke('send-transfer-email', {
      body: { action: 'initiate', projectId, toEmail },
    })
    if (error) return { ok: false, error: await extractError(error) }
    return { ok: true }
  }

  async function accept(transferId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.functions.invoke('send-transfer-email', {
      body: { action: 'accept', transferId },
    })
    if (error) return { ok: false, error: await extractError(error) }
    _pending.value = _pending.value.filter((t) => t.id !== transferId)
    return { ok: true }
  }

  async function decline(transferId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase
      .from('ownership_transfers')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', transferId)
    if (error) return { ok: false, error: error.message }
    _pending.value = _pending.value.filter((t) => t.id !== transferId)
    return { ok: true }
  }

  async function cancel(transferId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase
      .from('ownership_transfers')
      .update({ status: 'cancelled', responded_at: new Date().toISOString() })
      .eq('id', transferId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  function openTransferModal(projectId: string, projectName: string): void {
    _transferModal.value = { projectId, projectName }
  }

  function closeTransferModal(): void {
    _transferModal.value = null
  }

  return {
    pending:            _pending,
    loading:            _loading,
    transferModalState: _transferModal,
    loadPending,
    initiateTransfer,
    accept,
    decline,
    cancel,
    openTransferModal,
    closeTransferModal,
  }
}
