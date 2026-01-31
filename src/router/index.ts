import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login' // 默认跳转到登录页
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/Login.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/Register.vue')
    },
    {
      path: '/nothing',
      name: 'Nothing',
      component: () => import('@/views/nothing/Nothing.vue'),
      meta: { requiresAuth: true } // 需要登录才能访问
    }
  ]
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  
  // 如果访问需要登录的页面且没有token，跳转到登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router