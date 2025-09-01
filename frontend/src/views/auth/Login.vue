<template>
  <div class="card shadow">
    <div class="card-body p-5">
      <div class="text-center mb-4">
        <i class="bi bi-house-door-fill display-4 text-primary"></i>
        <h2 class="mt-3 mb-0">Welcome Back</h2>
        <p class="text-muted">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Email Address</label>
          <input
            type="email"
            class="form-control"
            id="email"
            v-model="form.email"
            required
            :disabled="loading"
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            id="password"
            v-model="form.password"
            required
            :disabled="loading"
          />
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="remember"
            v-model="form.remember"
          />
          <label class="form-check-label" for="remember">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 mb-3"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Sign In
        </button>
      </form>

      <div class="text-center my-3">
        <div class="text-muted small">OR</div>
      </div>

      <GoogleLoginButton />

      <div class="text-center">
        <p class="mb-0">
          Don't have an account?
          <router-link to="/auth/register" class="text-decoration-none">
            Sign up here
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import GoogleLoginButton from '@/components/GoogleLoginButton.vue'

export default {
  name: 'Login',
  components: {
    GoogleLoginButton
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const form = ref({
      email: '',
      password: '',
      remember: false,
    })

    const loading = ref(false)

    const handleLogin = async () => {
      try {
        loading.value = true
        await authStore.login({
          email: form.value.email,
          password: form.value.password,
        })

        appStore.showSuccess('Welcome back!', 'Login Successful')
        
        // Redirect to intended page or dashboard
        const redirect = router.currentRoute.value.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        console.error('Login error:', error)
        appStore.showError(
          error.response?.data?.message || 'Invalid email or password',
          'Login Failed'
        )
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      handleLogin,
    }
  },
}
</script>
