import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/views/EditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: EditorView },
    ...(import.meta.env.DEV
      ? [{ path: '/_dev', component: () => import('@/views/DevView.vue') }]
      : []),
  ],
})

export default router
