<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-file-text me-2"></i>
            Leases
          </h1>
          <router-link to="/leases/new" class="btn btn-primary">
            <i class="bi bi-plus-lg me-2"></i>
            New Lease
          </router-link>
        </div>

        <!-- Stats Cards -->
        <div class="row mb-4">
          <div class="col-xl-3 col-md-6 mb-3">
            <div class="card border-primary">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-check-circle-fill text-primary" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ activeLeases?.length || 0 }}</h5>
                    <p class="card-text text-muted small">Active Leases</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-3">
            <div class="card border-danger">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-x-circle-fill text-danger" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ expiredLeases?.length || 0 }}</h5>
                    <p class="card-text text-muted small">Expired</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-3">
            <div class="card border-warning">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ expiringLeases?.length || 0 }}</h5>
                    <p class="card-text text-muted small">Expiring (30d)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-3">
            <div class="card border-info">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-file-text-fill text-info" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ leases?.length || 0 }}</h5>
                    <p class="card-text text-muted small">Total Leases</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label for="statusFilter" class="form-label">Status</label>
                <select
                  id="statusFilter"
                  v-model="filters.status"
                  class="form-select"
                  @change="applyFilters"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div class="col-md-3">
                <label for="propertyFilter" class="form-label">Property</label>
                <select
                  id="propertyFilter"
                  v-model="filters.propertyId"
                  class="form-select"
                  @change="applyFilters"
                >
                  <option value="">All Properties</option>
                  <option v-for="property in availableProperties" :key="property.id" :value="property.id">
                    {{ property.title }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label for="tenantFilter" class="form-label">Tenant</label>
                <select
                  id="tenantFilter"
                  v-model="filters.tenantId"
                  class="form-select"
                  @change="applyFilters"
                >
                  <option value="">All Tenants</option>
                  <option v-for="tenant in availableTenants" :key="tenant.id" :value="tenant.id">
                    {{ tenant.first_name }} {{ tenant.last_name }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label for="searchFilter" class="form-label">Search</label>
                <input
                  id="searchFilter"
                  v-model="filters.search"
                  type="text"
                  class="form-control"
                  placeholder="Search leases..."
                  @input="applyFilters"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Leases Table -->
    
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading leases...</p>
        </div>

        <div v-else-if="leases.length === 0" class="text-center py-5">
          <i class="bi bi-file-text display-1 text-muted"></i>
          <h4 class="mt-3">No Leases Found</h4>
          <p class="text-muted">
            {{ Object.values(filters).some(f => f) ? 'No leases match your current filters.' : 'Create your first lease to get started.' }}
          </p>
          <router-link to="/leases/new" class="btn btn-primary">
            <i class="bi bi-plus-lg me-2"></i>
            Create First Lease
          </router-link>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Property</th>
                <th>Tenant</th>
                <th>Landlord</th>
                <th>Rent Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lease in leases" :key="lease.id">
                <td>
                  <div>
                    <div class="fw-medium">{{ lease.property?.title || 'Unknown Property' }}</div>
                    <small class="text-muted">
                      {{ formatAddress(lease.property) }}
                    </small>
                  </div>
                </td>
                <td>
                  <div>
                    <div class="fw-medium">
                      {{ lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant' }}
                    </div>
                    <small class="text-muted">{{ lease.tenant?.email }}</small>
                  </div>
                </td>
                <td>
                  <div>
                    <div class="fw-medium">
                      {{ lease.landlord ? `${lease.landlord.first_name} ${lease.landlord.last_name}` : 'No Landlord' }}
                    </div>
                    <small class="text-muted">{{ lease.landlord?.email }}</small>
                  </div>
                </td>
                <td>
                  <span class="fw-medium">${{ formatCurrency(lease.monthly_rent) }}</span>
                  <small class="text-muted d-block">per month</small>
                </td>
                <td>
                  <span class="fw-medium">{{ formatDate(lease.start_date) }}</span>
                </td>
                <td>
                  <span class="fw-medium">{{ formatDate(lease.end_date) }}</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(lease.status)">
                    {{ formatStatus(lease.status) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <router-link
                      :to="`/leases/${lease.id}`"
                      class="btn btn-outline-primary btn-sm"
                      title="View Details"
                    >
                      <i class="bi bi-eye"></i>
                    </router-link>
                    <router-link
                      :to="`/leases/${lease.id}/edit`"
                      class="btn btn-outline-secondary btn-sm"
                      title="Edit Lease"
                    >
                      <i class="bi bi-pencil"></i>
                    </router-link>
                    <button
                      @click="confirmDelete(lease)"
                      class="btn btn-outline-danger btn-sm"
                      title="Delete Lease"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
       

          <!-- Pagination -->
          <div v-if="pagination.pages > 1" class="card-footer">
            <nav>
              <ul class="pagination pagination-sm mb-0 justify-content-center">
                <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                  <button
                    class="page-link"
                    @click="changePage(pagination.page - 1)"
                    :disabled="pagination.page === 1"
                  >
                    Previous
                  </button>
                </li>
                <li
                  v-for="page in visiblePages"
                  :key="page"
                  class="page-item"
                  :class="{ active: page === pagination.page }"
                >
                  <button class="page-link" @click="changePage(page)">
                    {{ page }}
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                  <button
                    class="page-link"
                    @click="changePage(pagination.page + 1)"
                    :disabled="pagination.page === pagination.pages"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
      
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      class="modal fade"
      id="deleteModal"
      tabindex="-1"
      aria-labelledby="deleteModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">Confirm Delete</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this lease?</p>
            <div v-if="leaseToDelete" class="alert alert-warning">
              <strong>{{ leaseToDelete.property?.title }}</strong><br>
              Tenant: {{ leaseToDelete.tenant ? `${leaseToDelete.tenant.first_name} ${leaseToDelete.tenant.last_name}` : 'Unknown' }}<br>
              This action cannot be undone.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteLease"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Delete Lease
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLeaseStore } from '@/stores/leaseStore'
import { usePropertyStore } from '@/stores/propertyStore'
import { useContactStore } from '@/stores/contactStore'
import { format } from 'date-fns'
import { Modal } from 'bootstrap'

export default {
  name: 'LeaseList',
  setup() {
    const leaseStore = useLeaseStore()
    const propertyStore = usePropertyStore()
    const contactStore = useContactStore()

    const { 
      leases, 
      loading, 
      pagination, 
      activeLeases, 
      expiredLeases,
      expiringLeases
    } = storeToRefs(leaseStore)

    const filters = ref({
      status: '',
      propertyId: '',
      tenantId: '',
      search: ''
    })

    const availableProperties = ref([])
    const availableTenants = ref([])
    const leaseToDelete = ref(null)
    const deleteModal = ref(null)

    const visiblePages = computed(() => {
      const pages = []
      const current = pagination.value.page
      const total = pagination.value.pages
      
      // Show up to 5 pages around current page
      const start = Math.max(1, current - 2)
      const end = Math.min(total, current + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })

    const formatDate = (date) => {
      if (!date) return 'N/A'
      return format(new Date(date), 'MMM dd, yyyy')
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0.00'
      return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatStatus = (status) => {
      const statusMap = {
        active: 'Active',
        pending: 'Pending',
        expired: 'Expired',
        terminated: 'Terminated'
      }
      return statusMap[status] || status
    }

    const getStatusBadgeClass = (status) => {
      const classMap = {
        active: 'bg-success',
        pending: 'bg-warning text-dark',
        expired: 'bg-danger',
        terminated: 'bg-secondary'
      }
      return classMap[status] || 'bg-secondary'
    }

    const formatAddress = (property) => {
      if (!property) return 'Unknown Address'
      const parts = []
      if (property.street) parts.push(property.street)
      if (property.city) parts.push(property.city)
      if (property.state) parts.push(property.state)
      return parts.join(', ') || 'Unknown Address'
    }

    const loadData = async () => {
      try {
        // Load leases with current filters
        await leaseStore.fetchLeases(filters.value)
        
        // Debug: Log lease data
        console.log('Leases loaded:', leases.value?.length || 0)
        console.log('Active leases:', activeLeases.value?.length || 0)
        console.log('Expired leases:', expiredLeases.value?.length || 0)
        console.log('Expiring leases:', expiringLeases.value?.length || 0)
        console.log('Sample lease statuses:', leases.value?.map(l => l.status).slice(0, 5))
        
        // Load available properties and tenants for filters
        await Promise.all([
          propertyStore.fetchProperties({ limit: 100, isActive: 'true' }),
          contactStore.fetchContacts({ limit: 100, isActive: 'true' })
        ])
        
        availableProperties.value = propertyStore.properties
        availableTenants.value = contactStore.contacts.filter(contact => 
          contact.contact_type === 'tenant' || contact.contact_type === 'both'
        )
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const applyFilters = async () => {
      leaseStore.setFilters(filters.value)
      await leaseStore.fetchLeases()
    }

    const changePage = async (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        leaseStore.setPagination({ page })
        await leaseStore.fetchLeases()
      }
    }

    const refreshLeases = async () => {
      await leaseStore.fetchLeases()
    }

    const confirmDelete = (lease) => {
      leaseToDelete.value = lease
      if (!deleteModal.value) {
        deleteModal.value = new Modal(document.getElementById('deleteModal'))
      }
      deleteModal.value.show()
    }

    const deleteLease = async () => {
      if (!leaseToDelete.value) return
      
      try {
        await leaseStore.deleteLease(leaseToDelete.value.id)
        deleteModal.value.hide()
        leaseToDelete.value = null
      } catch (error) {
        console.error('Error deleting lease:', error)
      }
    }

    // Watch for filter changes
    watch(filters, () => {
      applyFilters()
    }, { deep: true })

    onMounted(() => {
      loadData()
    })

    return {
      leases,
      loading,
      pagination,
      activeLeases,
      expiredLeases,
      expiringLeases,
      filters,
      availableProperties,
      availableTenants,
      leaseToDelete,
      visiblePages,
      formatDate,
      formatCurrency,
      formatStatus,
      getStatusBadgeClass,
      formatAddress,
      applyFilters,
      changePage,
      refreshLeases,
      confirmDelete,
      deleteLease
    }
  }
}
</script>

<style scoped>
.card {
  border: 1px solid #e9ecef;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.15s ease-in-out;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}


.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}

.pagination-sm .page-link {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .btn-group .btn {
    padding: 0.125rem 0.25rem;
  }
  
  .btn-group .btn i {
    font-size: 0.875rem;
  }
}
</style>
