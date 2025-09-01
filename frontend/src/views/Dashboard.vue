<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-speedometer2 me-2"></i>
            Dashboard
          </h1>
          <div class="d-flex align-items-center">
            <div class="text-muted me-3">
              Welcome back, {{ user?.firstName }}!
            </div>
            <div class="tenant-info">
              <span class="badge bg-primary">
                <i class="bi bi-person-circle me-1"></i>
                Tenant ID: {{ user?.id?.slice(-8) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-xl-3 col-md-6 mb-4">
        <router-link to="/contacts" class="text-decoration-none">
          <div class="stats-card stats-card-clickable">
            <div class="stats-number">{{ stats.totalContacts || 0 }}</div>
            <div class="stats-label">
              <i class="bi bi-people me-1"></i>
              Total Contacts
            </div>
          </div>
        </router-link>
      </div>
      <div class="col-xl-3 col-md-6 mb-4">
        <router-link to="/properties" class="text-decoration-none">
          <div class="stats-card stats-card-clickable">
            <div class="stats-number">{{ stats.totalProperties || 0 }}</div>
            <div class="stats-label">
              <i class="bi bi-building me-1"></i>
              Properties
            </div>
          </div>
        </router-link>
      </div>
      <div class="col-xl-3 col-md-6 mb-4">
        <router-link to="/leases" class="text-decoration-none">
          <div class="stats-card stats-card-clickable">
            <div class="stats-number">{{ stats.activeLeases || 0 }}</div>
            <div class="stats-label">
              <i class="bi bi-file-text me-1"></i>
              Active Leases
            </div>
          </div>
        </router-link>
      </div>
      <div class="col-xl-3 col-md-6 mb-4">
        <router-link to="/leases" class="text-decoration-none">
          <div class="stats-card stats-card-warning stats-card-clickable">
            <div class="stats-number">{{ stats.expiringLeases || 0 }}</div>
            <div class="stats-label">
              <i class="bi bi-calendar-x me-1"></i>
              Expiring Soon
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Tenant Information -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h6 class="card-title mb-2">
                  <i class="bi bi-shield-check me-2 text-success"></i>
                  Multi-Tenant Security Active
                </h6>
                <p class="card-text text-muted mb-0">
                  Your data is completely isolated. You can only see and manage your own contacts, properties, and leases.
                </p>
              </div>
              <div class="col-md-4 text-md-end">
                <div class="tenant-stats">
                  <div class="text-muted small">Tenant ID</div>
                  <code class="text-primary">{{ user?.id }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Expiring Leases -->
      <div class="col-lg-8 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Leases Expiring Soon
          </div>
          <div class="card-body">
            <div v-if="allExpiringLeases.length === 0" class="text-center py-4">
              <i class="bi bi-check-circle text-success display-4"></i>
              <h5 class="mt-3">All Good!</h5>
              <p class="text-muted">No leases expiring in the next 100 days.</p>
            </div>
            <div v-else>
              <router-link
                v-for="lease in allExpiringLeases"
                :key="lease.id"
                :to="`/leases/${lease.id}`"
                class="text-decoration-none text-dark"
              >
                <div class="d-flex justify-content-between align-items-center border-bottom py-3 lease-item">
                  <div>
                    <h6 class="mb-1">{{ lease.property?.title }}</h6>
                    <p class="mb-0 text-muted">
                      <span v-if="lease.tenants && lease.tenants.length > 0">
                        {{ lease.tenants.map(t => `${t.first_name} ${t.last_name}`).join(', ') }}
                      </span>
                      <span v-else-if="lease.tenant">
                        {{ lease.tenant.first_name }} {{ lease.tenant.last_name }}
                      </span>
                    </p>
                  </div>
                  <div class="text-end">
                    <div class="badge mb-1" :class="getExpirationBadgeClass(lease.end_date)">
                      {{ formatDate(lease.end_date) }}
                    </div>
                    <div class="text-muted small">
                      {{ getDaysUntilExpiration(lease.end_date) }} days left
                    </div>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <i class="bi bi-clock-history me-2"></i>
            Recent Leases
          </div>
          <div class="card-body">
            <div v-if="recentLeases.length === 0" class="text-center py-4">
              <i class="bi bi-file-plus text-primary display-4"></i>
              <h6 class="mt-3">No Recent Leases</h6>
              <p class="text-muted small">Start by creating your first lease.</p>
              <router-link to="/leases/new" class="btn btn-primary btn-sm">
                Create Lease
              </router-link>
            </div>
            <div v-else>
              <router-link
                v-for="lease in recentLeases"
                :key="lease.id"
                :to="`/leases/${lease.id}`"
                class="text-decoration-none text-dark"
              >
                <div class="d-flex justify-content-between align-items-center border-bottom py-2 lease-item">
                  <div>
                    <div class="fw-medium small">{{ lease.property?.title }}</div>
                    <div class="text-muted small">
                      {{ lease.tenant?.first_name }} {{ lease.tenant?.last_name }}
                    </div>
                  </div>
                  <div class="text-end">
                    <div
                      class="badge"
                      :class="{
                        'bg-success': lease.status === 'active',
                        'bg-warning text-dark': lease.status === 'pending',
                        'bg-danger': lease.status === 'expired',
                        'bg-info': lease.status === 'terminated'
                      }"
                    >
                      {{ lease.status }}
                    </div>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <i class="bi bi-lightning me-2"></i>
            Quick Actions
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <router-link to="/contacts/new" class="btn btn-outline-primary w-100">
                  <i class="bi bi-person-plus me-2"></i>
                  Add Contact
                </router-link>
              </div>
              <div class="col-md-3 mb-3">
                <router-link to="/properties/new" class="btn btn-outline-primary w-100">
                  <i class="bi bi-building-add me-2"></i>
                  Add Property
                </router-link>
              </div>
              <div class="col-md-3 mb-3">
                <router-link to="/leases/new" class="btn btn-outline-primary w-100">
                  <i class="bi bi-file-plus me-2"></i>
                  Create Lease
                </router-link>
              </div>
              <div class="col-md-3 mb-3">
                <router-link to="/reports" class="btn btn-outline-primary w-100">
                  <i class="bi bi-graph-up me-2"></i>
                  View Reports
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { format, differenceInDays } from 'date-fns'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import api from '@/services/api'

export default {
  name: 'Dashboard',
  setup() {
    const authStore = useAuthStore()
    const appStore = useAppStore()
    
    const stats = ref({})
    const expiringLeases = ref({
      in30Days: [],
      in60Days: [],
      in100Days: []
    })
    const recentLeases = ref([])

    const user = computed(() => authStore.user)

    const allExpiringLeases = computed(() => {
      const all = [
        ...(expiringLeases.value.in30Days || []),
        ...(expiringLeases.value.in60Days || []),
        ...(expiringLeases.value.in100Days || [])
      ]
      // Remove duplicates and sort by end date
      const unique = all.filter((lease, index, arr) => 
        arr.findIndex(l => l.id === lease.id) === index
      )
      return unique.sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    })

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US').format(amount)
    }

    const formatDate = (date) => {
      if (!date) return 'N/A'
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Invalid Date'
      return format(dateObj, 'MMM dd, yyyy')
    }

    const getDaysUntilExpiration = (endDate) => {
      if (!endDate) return 0
      const dateObj = new Date(endDate)
      if (isNaN(dateObj.getTime())) return 0
      return Math.max(0, differenceInDays(dateObj, new Date()))
    }

    const getExpirationBadgeClass = (endDate) => {
      const days = getDaysUntilExpiration(endDate)
      if (days <= 30) {
        return 'bg-danger text-white'
      } else if (days <= 60) {
        return 'bg-warning text-dark'
      } else {
        return 'bg-info text-dark'
      }
    }

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        const data = response.data.data
        
        stats.value = data.overview
        expiringLeases.value = {
          in30Days: data.expiringLeases.in30Days?.leases || [],
          in60Days: data.expiringLeases.in60Days?.leases || [],
          in100Days: data.expiringLeases.in100Days?.leases || []
        }
        recentLeases.value = data.recentLeases || []
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        appStore.showError('Failed to load dashboard data')
      }
    }

    onMounted(() => {
      fetchDashboardData()
    })

    return {
      user,
      stats,
      expiringLeases,
      allExpiringLeases,
      recentLeases,
      formatCurrency,
      formatDate,
      getDaysUntilExpiration,
      getExpirationBadgeClass,
    }
  },
}
</script>

<style scoped>
.tenant-info .badge {
  font-size: 0.75rem;
}

.stats-card-warning {
  border-left: 4px solid #ffc107;
}

.stats-card-warning .stats-number {
  color: #856404;
}

.tenant-stats code {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.stats-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
  transition: transform 0.2s ease-in-out;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  color: #495057;
  margin-bottom: 0.5rem;
}

.stats-label {
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

/* Clickable stats cards */
.stats-card-clickable {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.stats-card-clickable:hover {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.stats-card-clickable:hover .stats-number {
  color: #0d6efd;
}

.stats-card-clickable:hover .stats-label {
  color: #495057;
}

/* Clickable lease items */
.lease-item {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  border-radius: 0.375rem;
  margin: -0.25rem;
  padding: 0.75rem !important;
}

.lease-item:hover {
  background-color: #f8f9fa;
}

.lease-item:hover h6,
.lease-item:hover .fw-medium {
  color: #0d6efd !important;
}
</style>
