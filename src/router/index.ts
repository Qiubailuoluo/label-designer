import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
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
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/Dashboard.vue')
        },
        {
          path: 'nothing',
          name: 'Nothing',
          component: () => import('@/views/nothing/Nothing.vue')
        },
        {
          path: 'user-info',
          name: 'UserInfo',
          component: () => import('@/views/user-info/UserInfo.vue')
        },
        {
          path: 'label-designer',
          name: 'TemplateList',
          component: () => import('@/views/label-designer/TemplateList.vue'),
          meta: { requiresAuth: true, title: '模板设置' }
        },
        {
          path: 'label-designer/design/:id?',
          name: 'LabelDesigner',
          component: () => import('@/views/label-designer/LabelDesigner.vue'),
          meta: { requiresAuth: true, title: '标签设计器' }
        }
      ]
    },
    // 404页面
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  
  // 如果访问需要登录的页面且没有token，跳转到登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } 
  // 如果已经登录，访问登录/注册页则跳转到首页
  else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router