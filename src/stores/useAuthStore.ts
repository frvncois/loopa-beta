import { ref, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '@/core/supabase/client'
import type { User, UserProfile, AuthStatus, Plan } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const status  = ref<AuthStatus>('loading')

  const isLoaded = computed(() => status.value !== 'loading')

  // ── Internal helpers ──────────────────────────────────────────────────────

  async function _loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[auth] Failed to load profile', error)
    }
    if (!data) {
      console.warn('[auth] No profiles row for user', userId)
      return
    }

    profile.value = {
      id:                    data.id,
      displayName:           data.display_name,
      avatarUrl:             data.avatar_url,
      plan:                  data.plan as Plan,
      subscriptionStatus:    (data.subscription_status as UserProfile['subscriptionStatus']) ?? null,
      subscriptionPeriodEnd: data.subscription_period_end
        ? new Date(data.subscription_period_end).getTime()
        : null,
      storageUsedBytes:      data.storage_used_bytes,
      notificationPrefs:     (data.notification_prefs as Record<string, boolean>) ?? {},
    }
  }

  // ── Public actions ────────────────────────────────────────────────────────

  async function refresh(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      user.value    = null
      profile.value = null
      status.value  = 'anonymous'
      return
    }

    user.value   = { id: session.user.id, email: session.user.email ?? '' }
    status.value = 'authenticated'
    await _loadProfile(session.user.id)
  }

  async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function signUp(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function updatePassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function signOut(): Promise<void> {
    user.value    = null
    profile.value = null
    status.value  = 'anonymous'
    // scope:'local' clears localStorage without a network request — no lock-wait, no hang.
    await supabase.auth.signOut({ scope: 'local' })
  }

  // ── Auth state listener ───────────────────────────────────────────────────

  // Resolves once the initial Supabase auth state is known.
  // Used by main.ts instead of getSession(), which can hang when the Supabase
  // client's internal auto-refresh holds the NavigatorLock on startup.
  let _resolveReady: () => void = () => {}
  const ready = new Promise<void>(r => { _resolveReady = r })
  let _readyFired = false

  supabase.auth.onAuthStateChange((event, session) => {
    // A TOKEN_REFRESHED that arrives after we've already signed out locally is a
    // stale race — the refresh completed just as sign-out cleared the session.
    // Ignore it so it doesn't flip us back to 'authenticated'.
    const staleRefresh = event === 'TOKEN_REFRESHED' && status.value === 'anonymous'
    if (!staleRefresh) {
      if (!session) {
        user.value    = null
        profile.value = null
        status.value  = 'anonymous'
      } else {
        user.value   = { id: session.user.id, email: session.user.email ?? '' }
        status.value = 'authenticated'
      }
    }
    if (!_readyFired) { _readyFired = true; _resolveReady() }
    // Fire-and-forget: don't block auth events on the DB query.
    // Supabase v2 awaits onAuthStateChange callbacks — awaiting _loadProfile here
    // would cause signInWithPassword to stall if the profiles query is slow.
    if (session && !staleRefresh) _loadProfile(session.user.id).catch(console.error)
  })

  return { user, profile, status, isLoaded, ready, signIn, signUp, signOut, refresh, requestPasswordReset, updatePassword }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
