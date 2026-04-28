import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',    component: () => import('@/views/LandingView.vue') },
    { path: '/app', component: () => import('@/views/EditorView.vue') },
  ],
})

export default router
