import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/core/supabase/client'
import type { User, UserProfile, AuthStatus, Plan } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const status  = ref<AuthStatus>('loading')

  const isLoaded = computed(() => status.value !== 'loading')

  // ── Internal helpers ──────────────────────────────────────────────────────

  async function _loadProfile(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!data) return

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

  async function signIn(email: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    user.value    = null
    profile.value = null
    status.value  = 'anonymous'
  }

  // ── Auth state listener ───────────────────────────────────────────────────

  // Resolves once the initial Supabase auth state is known.
  // Used by main.ts instead of getSession(), which can hang when the Supabase
  // client's internal auto-refresh holds the NavigatorLock on startup.
  let _resolveReady: () => void = () => {}
  const ready = new Promise<void>(r => { _resolveReady = r })
  let _readyFired = false

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      user.value    = null
      profile.value = null
      status.value  = 'anonymous'
    } else {
      user.value   = { id: session.user.id, email: session.user.email ?? '' }
      status.value = 'authenticated'
    }
    if (!_readyFired) { _readyFired = true; _resolveReady() }
    if (session) await _loadProfile(session.user.id)
  })

  return { user, profile, status, isLoaded, ready, signIn, signOut, refresh }
})
