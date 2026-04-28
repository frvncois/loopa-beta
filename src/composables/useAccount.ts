import { supabase } from '@/core/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

// deleteAccount() calls the Postgres function below.
// Run this once in your Supabase SQL editor:
//
//   create or replace function delete_account()
//   returns void language plpgsql security definer as $$
//   begin
//     delete from profiles where id = auth.uid();
//   end;
//   $$;
//   grant execute on function delete_account() to authenticated;
//
// Deleting the profiles row cascades to projects, project_versions, and project_media
// via foreign key ON DELETE CASCADE constraints defined in 0001_init.sql.

export function useAccount() {
  const auth = useAuthStore()

  async function updateDisplayName(name: string): Promise<{ ok: boolean; error?: string }> {
    if (!auth.user) return { ok: false, error: 'Not authenticated' }
    const trimmed = name.trim() || null
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', auth.user.id)
    if (error) return { ok: false, error: error.message }
    if (auth.profile) auth.profile = { ...auth.profile, displayName: trimmed }
    return { ok: true }
  }

  async function updateAvatar(file: File): Promise<{ ok: boolean; error?: string; url?: string }> {
    if (!auth.user) return { ok: false, error: 'Not authenticated' }
    // Stored in the `avatars` (public-read) Supabase Storage bucket.
    // Path: {user_id}/avatar — one file per user, upserted on each upload.
    const path = `${auth.user.id}/avatar`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { ok: false, error: uploadErr.message }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl

    await supabase.from('profiles').update({ avatar_url: url }).eq('id', auth.user.id)
    if (auth.profile) auth.profile = { ...auth.profile, avatarUrl: url }
    return { ok: true, url }
  }

  async function changeEmail(email: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.rpc('delete_account')
    if (error) return { ok: false, error: error.message }
    await auth.signOut()
    return { ok: true }
  }

  return { updateDisplayName, updateAvatar, changeEmail, deleteAccount }
}
