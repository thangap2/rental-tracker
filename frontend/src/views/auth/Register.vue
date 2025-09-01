<template>
  <div class="card shadow">
    <div class="card-body p-5">
      <div class="text-center mb-4">
        <i class="bi bi-person-plus-fill display-4 text-primary"></i>
        <h2 class="mt-3 mb-0">Create Account</h2>
        <p class="text-muted">Join our platform to manage your rentals</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="firstName" class="form-label">First Name</label>
            <input
              type="text"
              class="form-control"
              id="firstName"
              v-model="form.firstName"
              required
              :disabled="loading"
            />
          </div>
          <div class="col-md-6 mb-3">
            <label for="lastName" class="form-label">Last Name</label>
            <input
              type="text"
              class="form-control"
              id="lastName"
              v-model="form.lastName"
              required
              :disabled="loading"
            />
          </div>
        </div>

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
            minlength="6"
            :disabled="loading"
          />
          <div class="form-text">
            Password must be at least 6 characters long.
          </div>
        </div>

        <div class="mb-3">
          <label for="phone" class="form-label">Phone Number</label>
          <input
            type="tel"
            class="form-control"
            id="phone"
            v-model="form.phone"
            :disabled="loading"
          />
        </div>

        <div class="mb-3">
          <label for="licenseNumber" class="form-label">License Number</label>
          <input
            type="text"
            class="form-control"
            id="licenseNumber"
            v-model="form.licenseNumber"
            :disabled="loading"
          />
        </div>

        <div class="mb-3">
          <label for="brokerage" class="form-label">Brokerage</label>
          <input
            type="text"
            class="form-control"
            id="brokerage"
            v-model="form.brokerage"
            :disabled="loading"
          />
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="terms"
            v-model="form.agreeToTerms"
            required
          />
          <label class="form-check-label" for="terms">
            I agree to the
            <a href="#" class="text-decoration-none">Terms of Service</a>
            and
            <a href="#" class="text-decoration-none">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 mb-3"
          :disabled="loading || !form.agreeToTerms"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Create Account
        </button>
      </form>

      <div class="text-center my-3">
        <div class="text-muted small">OR</div>
      </div>

      <GoogleLoginButton />

      <div class="text-center">
        <p class="mb-0">
          Already have an account?
          <router-link to="/auth/login" class="text-decoration-none">
            Sign in here
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
  name: 'Register',
  components: {
    GoogleLoginButton
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      licenseNumber: '',
      brokerage: '',
      agreeToTerms: false,
    })

    const loading = ref(false)

    const handleRegister = async () => {
      try {
        loading.value = true
        await authStore.register({
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          email: form.value.email,
          password: form.value.password,
          phone: form.value.phone,
          licenseNumber: form.value.licenseNumber,
          brokerage: form.value.brokerage,
        })

        appStore.showSuccess(
          'Your account has been created successfully!',
          'Registration Successful'
        )
        
        router.push('/')
      } catch (error) {
        console.error('Registration error:', error)
        appStore.showError(
          error.response?.data?.message || 'Registration failed. Please try again.',
          'Registration Failed'
        )
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      handleRegister,
    }
  },
}
</script>
