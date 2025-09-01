<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100">
    <div class="text-center">
      <div v-if="isProcessing">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Processing your login...</p>
      </div>
      <div v-else-if="error" class="alert alert-danger">
        <h4>Login Failed</h4>
        <p>{{ error }}</p>
        <router-link to="/login" class="btn btn-primary">
          Try Again
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'OAuthCallback',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    
    const isProcessing = ref(true)
    const error = ref('')

    const handleCallback = async () => {
      try {
        const token = route.query.token
        const errorParam = route.query.error

        if (errorParam) {
          throw new Error(getErrorMessage(errorParam))
        }

        if (!token) {
          throw new Error('No authentication token received')
        }

        // Store the token in localStorage and auth store
        localStorage.setItem('token', token)
        authStore.token = token
        
        // Set authorization header for API calls
        const api = (await import('@/services/api')).default
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Get user profile
        await authStore.getProfile()

        // Redirect to dashboard
        router.push({ name: 'dashboard' })
      } catch (err) {
        console.error('OAuth callback error:', err)
        error.value = err.message || 'An unexpected error occurred'
        isProcessing.value = false
      }
    }

    const getErrorMessage = (errorCode) => {
      const errorMessages = {
        'oauth_failed': 'Google authentication failed. Please try again.',
        'oauth_error': 'An error occurred during authentication. Please try again.',
        'access_denied': 'Access was denied. Please authorize the application to continue.'
      }
      return errorMessages[errorCode] || 'Authentication failed. Please try again.'
    }

    onMounted(() => {
      handleCallback()
    })

    return {
      isProcessing,
      error
    }
  }
}
</script>
