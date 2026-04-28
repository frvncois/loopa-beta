import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/main.css'

// Import all tool modules for their registerTool() side effects
import './tools/index'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/useAuthStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Register the onAuthStateChange listener synchronously (before any awaits)
// so we don't miss the INITIAL_SESSION event that Supabase fires asynchronously.
const auth = useAuthStore()

app.use(router)

// Wait for Supabase to determine the initial session state.
// Using auth.ready (resolved by onAuthStateChange) instead of calling
// refresh() / getSession() here avoids a NavigatorLock hang: when a session
// is stored, getSession() waits for the same lock that Supabase's internal
// auto-refresh already holds, so the promise never resolves.
await auth.ready

app.mount('#app')
