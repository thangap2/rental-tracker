import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard-alt',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      component: () => import('@/views/auth/AuthLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/Login.vue'),
          meta: { guest: true },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/auth/Register.vue'),
          meta: { guest: true },
        },
      ],
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('@/views/OAuthCallback.vue'),
      meta: { guest: true },
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('@/views/contacts/ContactList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/new',
      name: 'contact-create',
      component: () => import('@/views/contacts/ContactForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/:id',
      name: 'contact-detail',
      component: () => import('@/views/contacts/ContactDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/:id/edit',
      name: 'contact-edit',
      component: () => import('@/views/contacts/ContactForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties',
      name: 'properties',
      component: () => import('@/views/properties/PropertyList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/new',
      name: 'property-create',
      component: () => import('@/views/properties/PropertyForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/:id',
      name: 'property-detail',
      component: () => import('@/views/properties/PropertyDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/properties/:id/edit',
      name: 'property-edit',
      component: () => import('@/views/properties/PropertyForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leases',
      name: 'leases',
      component: () => import('@/views/leases/LeaseList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leases/new',
      name: 'lease-create',
      component: () => import('@/views/leases/LeaseForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leases/:id',
      name: 'lease-detail',
      component: () => import('@/views/leases/LeaseDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leases/:id/edit',
      name: 'lease-edit',
      component: () => import('@/views/leases/LeaseForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reminders',
      name: 'reminders',
      component: () => import('@/views/reminders/ReminderManagement.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/emails',
      name: 'emails',
      component: () => import('@/views/EmailManagement.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/Reports.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not already done
  if (!authStore.user && localStorage.getItem('token')) {
    authStore.initializeAuth()
  }

  console.log('Router navigation:', {
    to: to.path,
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!localStorage.getItem('token'),
    requiresAuth: to.meta.requiresAuth,
    isGuest: to.meta.guest
  })

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirecting to login - no auth')
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    console.log('Redirecting to dashboard - already authenticated')
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
