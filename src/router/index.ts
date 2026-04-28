import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',              component: () => import('@/views/LandingView.vue') },
    { path: '/app',           component: () => import('@/views/EditorView.vue') },
    { path: '/app/:slug',     component: () => import('@/views/EditorView.vue'), meta: { requiresAuth: true } },
    { path: '/login',         component: () => import('@/views/LoginView.vue') },
    { path: '/auth/callback',   component: () => import('@/views/AuthCallbackView.vue') },
    { path: '/dashboard',       component: () => import('@/views/DashboardView.vue'),  meta: { requiresAuth: true } },
    { path: '/dashboard/trash', component: () => import('@/views/TrashView.vue'),      meta: { requiresAuth: true } },
    { path: '/account',         component: () => import('@/views/AccountView.vue'),    meta: { requiresAuth: true } },
    // /app/:slug, /account added in later phases with requiresAuth: true
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && auth.status === 'anonymous') {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login' && auth.status === 'authenticated') {
    return { path: '/dashboard' }
  }
})

export default router
