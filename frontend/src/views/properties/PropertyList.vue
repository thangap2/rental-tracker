<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-building me-2"></i>
            Properties
            <span class="badge bg-secondary ms-2">{{ pagination.total }}</span>
          </h1>
          <router-link to="/properties/new" class="btn btn-primary">
            <i class="bi bi-building-add me-2"></i>
            Add Property
          </router-link>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Search</label>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control"
                  placeholder="Search by title, address..."
                  @input="debouncedSearch"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Property Type</label>
                <select v-model="selectedPropertyType" class="form-select" @change="applyFilters">
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="duplex">Duplex</option>
                  <option value="studio">Studio</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Status</label>
                <select v-model="selectedStatus" class="form-select" @change="applyFilters">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button @click="clearFilters" class="btn btn-outline-secondary w-100">
                  <i class="bi bi-arrow-clockwise me-1"></i>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Properties Grid/List -->
        <div class="card">
          <div class="card-body">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2 text-muted">Loading properties...</p>
            </div>

            <div v-else-if="properties.length === 0" class="text-center py-5">
              <i class="bi bi-building display-1 text-muted"></i>
              <h4 class="mt-3">No Properties Found</h4>
              <p class="text-muted">
                {{ hasFilters ? 'No properties match your current filters.' : 'You haven\'t added any properties yet.' }}
              </p>
              <router-link to="/properties/new" class="btn btn-primary">
                <i class="bi bi-building-add me-2"></i>
                Add Your First Property
              </router-link>
            </div>

            <div v-else>
              <!-- View Toggle -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="btn-group btn-group-sm" role="group">
                  <input type="radio" class="btn-check" name="viewType" id="gridView" v-model="viewType" value="grid">
                  <label class="btn btn-outline-secondary" for="gridView">
                    <i class="bi bi-grid-3x3-gap"></i>
                  </label>
                  <input type="radio" class="btn-check" name="viewType" id="listView" v-model="viewType" value="list">
                  <label class="btn btn-outline-secondary" for="listView">
                    <i class="bi bi-list"></i>
                  </label>
                </div>
                <small class="text-muted">{{ properties.length }} properties</small>
              </div>

              <!-- Grid View -->
              <div v-if="viewType === 'grid'" class="row g-4">
                <div v-for="property in properties" :key="property.id" class="col-lg-4 col-md-6">
                  <div class="card property-card h-100">
                    <div class="property-image">
                      <img
                        :src="property.images?.[0] || '/placeholder-property.jpg'"
                        class="card-img-top"
                        :alt="property.title"
                        @error="handleImageError"
                      >
                      <div class="property-badges">
                        <span class="badge" :class="property.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ property.is_active ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="badge bg-primary">{{ formatPropertyType(property.property_type) }}</span>
                      </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                      <h5 class="card-title">
                        <router-link :to="`/properties/${property.id}`" class="text-decoration-none property-title-link">
                          {{ property.title }}
                        </router-link>
                      </h5>
                      <p class="card-text text-muted mb-2">
                        <i class="bi bi-geo-alt me-1"></i>
                        {{ formatAddress(property) }}
                      </p>
                      <div class="property-details mb-3">
                        <div class="row g-2 text-center">
                          <div class="col-4">
                            <div class="detail-item">
                              <i class="bi bi-door-open text-primary"></i>
                              <small class="d-block">{{ property.bedrooms || 0 }} bed</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="detail-item">
                              <i class="bi bi-droplet text-info"></i>
                              <small class="d-block">{{ property.bathrooms || 0 }} bath</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="detail-item">
                              <i class="bi bi-arrows-fullscreen text-success"></i>
                              <small class="d-block">{{ formatSquareFootage(property.square_footage) }}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="property-owner mb-3">
                        <small class="text-muted">Owner:</small>
                        <div class="d-flex align-items-center">
                          <div class="owner-avatar me-2">
                            {{ getOwnerInitials(property.owner) }}
                          </div>
                          <div>
                            <div class="fw-medium">{{ getOwnerName(property.owner) }}</div>
                            <small class="text-muted">{{ property.owner?.email }}</small>
                          </div>
                        </div>
                      </div>
                      <div class="mt-auto">
                        <div class="btn-group w-100">
                          <router-link
                            :to="`/properties/${property.id}`"
                            class="btn btn-outline-primary btn-sm"
                          >
                            <i class="bi bi-eye me-1"></i>
                            View
                          </router-link>
                          <router-link
                            :to="`/properties/${property.id}/edit`"
                            class="btn btn-outline-secondary btn-sm"
                          >
                            <i class="bi bi-pencil me-1"></i>
                            Edit
                          </router-link>
                          <button
                            @click="confirmDelete(property)"
                            class="btn btn-outline-danger btn-sm"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- List View -->
              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Property</th>
                      <th>Address</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="property in properties" :key="property.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <img
                            :src="property.images?.[0] || '/placeholder-property.jpg'"
                            class="property-thumb me-3"
                            :alt="property.title"
                            @error="handleImageError"
                          >
                          <div>
                            <div class="fw-medium">
                              <router-link :to="`/properties/${property.id}`" class="text-decoration-none property-title-link">
                                {{ property.title }}
                              </router-link>
                            </div>
                            <small class="text-muted">{{ formatDate(property.created_at) }}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{{ formatAddress(property) }}</div>
                      </td>
                      <td>
                        <span class="badge bg-primary">{{ formatPropertyType(property.property_type) }}</span>
                      </td>
                      <td>
                        <div class="property-specs">
                          <span class="me-2">
                            <i class="bi bi-door-open me-1"></i>{{ property.bedrooms || 0 }}
                          </span>
                          <span class="me-2">
                            <i class="bi bi-droplet me-1"></i>{{ property.bathrooms || 0 }}
                          </span>
                          <span>
                            <i class="bi bi-arrows-fullscreen me-1"></i>{{ formatSquareFootage(property.square_footage) }}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="owner-avatar-sm me-2">
                            {{ getOwnerInitials(property.owner) }}
                          </div>
                          <div>
                            <div class="fw-medium">{{ getOwnerName(property.owner) }}</div>
                            <small class="text-muted">{{ property.owner?.phone }}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge" :class="property.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ property.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <router-link
                            :to="`/properties/${property.id}`"
                            class="btn btn-outline-primary"
                            title="View Details"
                          >
                            <i class="bi bi-eye"></i>
                          </router-link>
                          <router-link
                            :to="`/properties/${property.id}/edit`"
                            class="btn btn-outline-secondary"
                            title="Edit Property"
                          >
                            <i class="bi bi-pencil"></i>
                          </router-link>
                          <button
                            @click="confirmDelete(property)"
                            class="btn btn-outline-danger"
                            title="Delete Property"
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
              <nav v-if="pagination.pages > 1" class="mt-4">
                <ul class="pagination justify-content-center">
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
            <p>Are you sure you want to delete <strong>{{ propertyToDelete?.title }}</strong>?</p>
            <p class="text-muted small">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteProperty"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Delete Property
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { usePropertyStore } from '@/stores/propertyStore'
import { format } from 'date-fns'

export default {
  name: 'PropertyList',
  setup() {
    const propertyStore = usePropertyStore()
    const searchQuery = ref('')
    const selectedPropertyType = ref('')
    const selectedStatus = ref('true')
    const propertyToDelete = ref(null)
    const searchTimeout = ref(null)
    const viewType = ref('list')

    const { properties, loading, pagination, filters } = propertyStore

    const hasFilters = computed(() => {
      return filters.search || filters.propertyType || filters.isActive !== 'true'
    })

    const visiblePages = computed(() => {
      const pages = []
      const current = pagination.value.page
      const total = pagination.value.pages
      const delta = 2

      for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
        pages.push(i)
      }

      return pages
    })

    const debouncedSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      searchTimeout.value = setTimeout(() => {
        applyFilters()
      }, 300)
    }

    const applyFilters = () => {
      propertyStore.setFilters({
        search: searchQuery.value,
        propertyType: selectedPropertyType.value,
        isActive: selectedStatus.value
      })
      propertyStore.fetchProperties()
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedPropertyType.value = ''
      selectedStatus.value = 'true'
      applyFilters()
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        propertyStore.setPagination({ page })
        propertyStore.fetchProperties()
      }
    }

    const confirmDelete = (property) => {
      propertyToDelete.value = property
      const modal = new bootstrap.Modal(document.getElementById('deleteModal'))
      modal.show()
    }

    const deleteProperty = async () => {
      if (propertyToDelete.value) {
        try {
          await propertyStore.deleteProperty(propertyToDelete.value.id)
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'))
          modal.hide()
          propertyToDelete.value = null
          
          // Refresh the list
          await propertyStore.fetchProperties()
        } catch (error) {
          console.error('Error deleting property:', error)
        }
      }
    }

    const formatPropertyType = (type) => {
      const types = {
        apartment: 'Apartment',
        house: 'House',
        condo: 'Condo',
        townhouse: 'Townhouse',
        duplex: 'Duplex',
        studio: 'Studio',
        other: 'Other'
      }
      return types[type] || type
    }

    const formatAddress = (property) => {
      const parts = []
      if (property.street) parts.push(property.street)
      if (property.city) parts.push(property.city)
      if (property.state) parts.push(property.state)
      return parts.join(', ')
    }

    const formatSquareFootage = (sqft) => {
      if (!sqft) return 'N/A'
      return `${sqft.toLocaleString()} sq ft`
    }

    const getOwnerName = (owner) => {
      if (!owner) return 'No Owner'
      return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unknown'
    }

    const getOwnerInitials = (owner) => {
      if (!owner) return 'NO'
      return `${owner.first_name?.charAt(0) || ''}${owner.last_name?.charAt(0) || ''}`.toUpperCase() || 'NO'
    }

    const formatDate = (date) => {
      if (!date) return ''
      return format(new Date(date), 'MMM dd, yyyy')
    }

    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }

    onMounted(() => {
      propertyStore.fetchProperties()
    })

    return {
      properties,
      loading,
      pagination,
      filters,
      searchQuery,
      selectedPropertyType,
      selectedStatus,
      propertyToDelete,
      viewType,
      hasFilters,
      visiblePages,
      debouncedSearch,
      applyFilters,
      clearFilters,
      changePage,
      confirmDelete,
      deleteProperty,
      formatPropertyType,
      formatAddress,
      formatSquareFootage,
      getOwnerName,
      getOwnerInitials,
      formatDate,
      handleImageError
    }
  }
}
</script>

<style scoped>
.property-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.property-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.property-image {
  position: relative;
  overflow: hidden;
}

.property-image img {
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s;
}

.property-card:hover .property-image img {
  transform: scale(1.05);
}

.property-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.property-details {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
}

.detail-item {
  text-align: center;
}

.detail-item i {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.owner-avatar, .owner-avatar-sm {
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.owner-avatar {
  width: 32px;
  height: 32px;
}

.owner-avatar-sm {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.property-thumb {
  width: 60px;
  height: 45px;
  object-fit: cover;
  border-radius: 4px;
}

.property-specs {
  font-size: 0.875rem;
  color: #6c757d;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

/* Clickable property titles */
.property-title-link {
  color: inherit;
  transition: color 0.2s ease-in-out;
}

.property-title-link:hover {
  color: #0d6efd !important;
}

</style>
