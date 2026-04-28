import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',    component: () => import('@/views/LandingView.vue') },
    { path: '/app', component: () => import('@/views/EditorView.vue') },
    ...(import.meta.env.DEV
      ? [{ path: '/_dev', component: () => import('@/views/DevView.vue') }]
      : []),
  ],
})

export default router
