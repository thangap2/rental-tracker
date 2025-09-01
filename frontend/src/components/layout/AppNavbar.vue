<template>
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-house-door-fill me-2"></i>
        Rental Tracker
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/" exact-active-class="active">
              <i class="bi bi-speedometer2 me-1"></i>
              Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/contacts" active-class="active">
              <i class="bi bi-people me-1"></i>
              Contacts
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/properties" active-class="active">
              <i class="bi bi-building me-1"></i>
              Properties
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/leases" active-class="active">
              <i class="bi bi-file-text me-1"></i>
              Leases
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/reminders" active-class="active">
              <i class="bi bi-bell me-1"></i>
              Reminders
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/emails" active-class="active">
              <i class="bi bi-envelope me-1"></i>
              Emails
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/reports" active-class="active">
              <i class="bi bi-graph-up me-1"></i>
              Reports
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle me-1"></i>
              {{ user?.firstName }} {{ user?.lastName }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link class="dropdown-item" to="/profile">
                  <i class="bi bi-person me-2"></i>
                  Profile
                </router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#" @click="handleLogout">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  Logout
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

export default {
  name: 'AppNavbar',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const user = computed(() => authStore.user)

    const handleLogout = async () => {
      try {
        await authStore.logout()
        appStore.showSuccess('You have been logged out successfully')
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout error:', error)
        appStore.showError('An error occurred during logout')
      }
    }

    return {
      user,
      handleLogout,
    }
  },
}
</script>
