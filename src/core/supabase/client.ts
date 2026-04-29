import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

// Persist the client across Vite HMR re-evaluations to prevent lock
// contention from multiple GoTrueClient instances being created per tab.
type Client = ReturnType<typeof createClient<Database>>
const _prev = import.meta.hot?.data.client as Client | undefined
export const supabase: Client = _prev ?? createClient<Database>(supabaseUrl, supabaseKey)
if (import.meta.hot) {
  import.meta.hot.data.client = supabase
  // When client.ts itself changes, clear the stored instance so the next
  // evaluation creates a fresh client with the updated options.
  import.meta.hot.dispose(() => { import.meta.hot!.data.client = undefined })
}
