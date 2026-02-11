/**
 * 路由配置：登录/注册、需鉴权的主布局子路由（仪表盘、模板设置、设计器、连接打印）、404 重定向
 */
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
        },
        {
          path: 'connect-print',
          name: 'ConnectPrint',
          component: () => import('@/views/connect-print/ConnectPrint.vue'),
          meta: { requiresAuth: true, title: '连接打印' }
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

/** 路由守卫：requiresAuth 且无 token 时跳转登录；已登录访问 /login|/register 时跳转首页 */
router.beforeEach((to, _from, next) => {
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