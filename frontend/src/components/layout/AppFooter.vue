<template>
  <footer class="bg-light py-4 mt-5">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h5 class="mb-3">
            <i class="bi bi-house-door-fill me-2"></i>
            Rental Tracker
          </h5>
          <p class="text-muted mb-0">
            Professional lease management for realtors. Track rental properties,
            manage contact relationships, and never miss a lease renewal.
          </p>
        </div>
        <div class="col-md-3">
          <h6 class="mb-3">Quick Links</h6>
          <ul class="list-unstyled">
            <li>
              <router-link to="/" class="text-decoration-none">Dashboard</router-link>
            </li>
            <li>
              <router-link to="/contacts" class="text-decoration-none">Contacts</router-link>
            </li>
            <li>
              <router-link to="/properties" class="text-decoration-none">Properties</router-link>
            </li>
            <li>
              <router-link to="/leases" class="text-decoration-none">Leases</router-link>
            </li>
          </ul>
        </div>
        <div class="col-md-3">
          <h6 class="mb-3">Support</h6>
          <ul class="list-unstyled">
            <li>
              <a href="#" class="text-decoration-none">Help Center</a>
            </li>
            <li>
              <a href="#" class="text-decoration-none">Contact Support</a>
            </li>
            <li>
              <a href="#" class="text-decoration-none">Privacy Policy</a>
            </li>
            <li>
              <a href="#" class="text-decoration-none">Terms of Service</a>
            </li>
          </ul>
        </div>
      </div>
      <hr class="my-4" />
      <div class="row align-items-center">
        <div class="col-md-6">
          <p class="text-muted mb-0">
            © {{ currentYear }} Rental Tracker. All rights reserved.
          </p>
        </div>
        <div class="col-md-6 text-md-end">
          <span class="text-muted">
            Version {{ appVersion }}
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AppFooter',
  setup() {
    const currentYear = computed(() => new Date().getFullYear())
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

    return {
      currentYear,
      appVersion,
    }
  },
}
</script>
