<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow">
          <div class="card-header bg-primary text-white">
            <h4 class="mb-0">
              <i class="bi bi-person-circle me-2"></i>
              User Profile
            </h4>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>
            
            <div v-else-if="userProfile" class="row">
              <!-- Profile Picture -->
              <div class="col-md-4 text-center mb-4">
                <img 
                  :src="userProfile.profilePicture || '/default-avatar.png'" 
                  alt="Profile Picture" 
                  class="rounded-circle mb-3"
                  style="width: 150px; height: 150px; object-fit: cover;"
                  @error="handleImageError"
                >
                <div class="registration-badge">
                  <span class="badge" :class="getRegistrationBadgeClass(userProfile.registrationSource)">
                    <i :class="getRegistrationIcon(userProfile.registrationSource)" class="me-1"></i>
                    {{ formatRegistrationSource(userProfile.registrationSource) }}
                  </span>
                </div>
                <div v-if="userProfile.emailVerified" class="mt-2">
                  <span class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Email Verified
                  </span>
                </div>
              </div>
              
              <!-- Profile Information -->
              <div class="col-md-8">
                <h5 class="mb-3">Personal Information</h5>
                <div class="row">
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">First Name</label>
                    <p class="form-control-plaintext">{{ userProfile.firstName }}</p>
                  </div>
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">Last Name</label>
                    <p class="form-control-plaintext">{{ userProfile.lastName }}</p>
                  </div>
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">Email</label>
                    <p class="form-control-plaintext">{{ userProfile.email }}</p>
                  </div>
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">Role</label>
                    <p class="form-control-plaintext">
                      <span class="badge bg-info">{{ userProfile.role }}</span>
                    </p>
                  </div>
                  <div class="col-sm-6 mb-3" v-if="userProfile.phone">
                    <label class="form-label fw-bold">Phone</label>
                    <p class="form-control-plaintext">{{ userProfile.phone }}</p>
                  </div>
                  <div class="col-sm-6 mb-3" v-if="userProfile.licenseNumber">
                    <label class="form-label fw-bold">License Number</label>
                    <p class="form-control-plaintext">{{ userProfile.licenseNumber }}</p>
                  </div>
                  <div class="col-12 mb-3" v-if="userProfile.brokerage">
                    <label class="form-label fw-bold">Brokerage</label>
                    <p class="form-control-plaintext">{{ userProfile.brokerage }}</p>
                  </div>
                </div>
                
                <h5 class="mb-3 mt-4">Account Information</h5>
                <div class="row">
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">Registration Method</label>
                    <p class="form-control-plaintext">
                      <i :class="getRegistrationIcon(userProfile.registrationSource)" class="me-2"></i>
                      {{ formatRegistrationSource(userProfile.registrationSource) }}
                    </p>
                  </div>
                  <div class="col-sm-6 mb-3" v-if="userProfile.lastLogin">
                    <label class="form-label fw-bold">Last Login</label>
                    <p class="form-control-plaintext">{{ formatDate(userProfile.lastLogin) }}</p>
                  </div>
                  <div class="col-sm-6 mb-3">
                    <label class="form-label fw-bold">Member Since</label>
                    <p class="form-control-plaintext">{{ formatDate(userProfile.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="text-end mt-4">
              <button class="btn btn-primary" @click="editProfile">
                <i class="bi bi-pencil me-2"></i>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Profile',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const userProfile = ref(null)
    const loading = ref(true)
    const error = ref('')

    const loadUserProfile = async () => {
      try {
        loading.value = true
        await authStore.getProfile()
        userProfile.value = authStore.user
      } catch (err) {
        error.value = 'Failed to load profile information'
        console.error('Profile load error:', err)
      } finally {
        loading.value = false
      }
    }

    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="#6c757d" class="bi bi-person-circle" viewBox="0 0 16 16">
          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
          <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
        </svg>
      `)
    }

    const getRegistrationIcon = (source) => {
      const iconMap = {
        email: 'bi bi-envelope',
        google: 'bi bi-google',
        facebook: 'bi bi-facebook',
        apple: 'bi bi-apple',
        linkedin: 'bi bi-linkedin',
        microsoft: 'bi bi-microsoft',
        other: 'bi bi-person-plus'
      }
      return iconMap[source] || 'bi bi-person-plus'
    }

    const getRegistrationBadgeClass = (source) => {
      const classMap = {
        email: 'bg-primary',
        google: 'bg-danger',
        facebook: 'bg-primary',
        apple: 'bg-dark',
        linkedin: 'bg-info',
        microsoft: 'bg-warning',
        other: 'bg-secondary'
      }
      return classMap[source] || 'bg-secondary'
    }

    const formatRegistrationSource = (source) => {
      const nameMap = {
        email: 'Email Registration',
        google: 'Google OAuth',
        facebook: 'Facebook OAuth',
        apple: 'Apple OAuth',
        linkedin: 'LinkedIn OAuth',
        microsoft: 'Microsoft OAuth',
        other: 'Other Method'
      }
      return nameMap[source] || 'Unknown'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const editProfile = () => {
      // Navigate to edit profile page (to be implemented)
      console.log('Edit profile functionality to be implemented')
    }

    onMounted(() => {
      loadUserProfile()
    })

    return {
      userProfile,
      loading,
      error,
      handleImageError,
      getRegistrationIcon,
      getRegistrationBadgeClass,
      formatRegistrationSource,
      formatDate,
      editProfile
    }
  }
}
</script>
