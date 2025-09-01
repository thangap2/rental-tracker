<template>
  <div id="app">
    <AppNavbar v-if="!isAuthRoute" />
    
    <main class="main-content" :class="{ 'auth-layout': isAuthRoute }">
      <router-view />
    </main>
    
    <AppFooter v-if="!isAuthRoute" />
    
    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <!-- Toast Container -->
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast show"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div class="toast-header">
          <i
            class="bi me-2"
            :class="{
              'bi-check-circle-fill text-success': toast.type === 'success',
              'bi-exclamation-triangle-fill text-warning': toast.type === 'warning',
              'bi-x-circle-fill text-danger': toast.type === 'error',
              'bi-info-circle-fill text-info': toast.type === 'info'
            }"
          ></i>
          <strong class="me-auto">{{ toast.title }}</strong>
          <button
            type="button"
            class="btn-close"
            @click="removeToast(toast.id)"
          ></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'
import AppNavbar from './components/layout/AppNavbar.vue'
import AppFooter from './components/layout/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppNavbar,
    AppFooter,
  },
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const isAuthRoute = computed(() => {
      return route.path.startsWith('/auth')
    })

    const loading = computed(() => appStore.loading)
    const toasts = computed(() => appStore.toasts)

    const removeToast = (id) => {
      appStore.removeToast(id)
    }

    onMounted(() => {
      // Initialize auth state from localStorage
      authStore.initializeAuth()
    })

    return {
      isAuthRoute,
      loading,
      toasts,
      removeToast,
    }
  },
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 76px; /* Account for fixed navbar */
}

.auth-layout {
  padding-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.toast-container .toast {
  margin-bottom: 0.5rem;
}
</style>
