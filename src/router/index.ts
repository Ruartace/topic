import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'journey',
      component: () => import('@/views/user/journeypage.vue'),
    },
  ],
})

export default router
