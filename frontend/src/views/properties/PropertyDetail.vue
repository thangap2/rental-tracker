<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-building me-2"></i>
            Property Details
          </h1>
          <div class="d-flex gap-2">
            <router-link
              v-if="property"
              :to="`/properties/${property.id}/edit`"
              class="btn btn-primary"
            >
              <i class="bi bi-pencil me-2"></i>
              Edit Property
            </router-link>
            <router-link to="/properties" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-2"></i>
              Back to Properties
            </router-link>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading property details...</p>
        </div>

        <div v-else-if="error || !property" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-muted"></i>
          <h4 class="mt-3">{{ error || 'Property Not Found' }}</h4>
          <p class="text-muted">
            {{ error || 'The requested property could not be found.' }}
          </p>
          <div class="d-flex gap-2 justify-content-center">
            <button @click="loadProperty" class="btn btn-outline-primary">
              <i class="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
            <router-link to="/properties" class="btn btn-primary">
              <i class="bi bi-arrow-left me-2"></i>
              Back to Properties
            </router-link>
          </div>
        </div>

        <div v-else class="row">
          <div class="col-lg-8">
            <!-- Property Images -->
            <div class="card mb-4">
              <div class="card-body p-0">
                <div v-if="property.images && property.images.length > 0" class="property-gallery">
                  <div id="propertyCarousel" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                      <button
                        v-for="(image, index) in property.images"
                        :key="index"
                        type="button"
                        data-bs-target="#propertyCarousel"
                        :data-bs-slide-to="index"
                        :class="{ active: index === 0 }"
                      ></button>
                    </div>
                    <div class="carousel-inner">
                      <div
                        v-for="(image, index) in property.images"
                        :key="index"
                        class="carousel-item"
                        :class="{ active: index === 0 }"
                      >
                        <img :src="image" class="d-block w-100 property-main-image" :alt="`${property.title} - Image ${index + 1}`">
                      </div>
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#propertyCarousel" data-bs-slide="prev">
                      <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#propertyCarousel" data-bs-slide="next">
                      <span class="carousel-control-next-icon"></span>
                    </button>
                  </div>
                </div>
                <div v-else class="no-image-placeholder">
                  <i class="bi bi-image display-1 text-muted"></i>
                  <p class="text-muted mt-2">No images available</p>
                </div>
              </div>
            </div>

            <!-- Property Information -->
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  Property Information
                </h5>
                <span class="badge" :class="property.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ property.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="card-body">
                <div class="row g-4">
                  <div class="col-12">
                    <h3 class="mb-2">{{ property.title }}</h3>
                    <p class="text-muted mb-3">
                      <i class="bi bi-geo-alt me-2"></i>
                      {{ formatAddress(property) }}
                    </p>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="form-label text-muted">Property Type</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-house me-2 text-muted"></i>
                      <span class="badge bg-primary">{{ formatPropertyType(property.property_type) }}</span>
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="form-label text-muted">Year Built</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-calendar me-2 text-muted"></i>
                      {{ property.year_built || 'Not specified' }}
                    </div>
                  </div>

                  <div class="col-12">
                    <div class="row g-3 property-specs">
                      <div class="col-md-3">
                        <div class="spec-item text-center">
                          <i class="bi bi-door-open text-primary"></i>
                          <div class="spec-value">{{ property.bedrooms || 0 }}</div>
                          <div class="spec-label">Bedrooms</div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="spec-item text-center">
                          <i class="bi bi-droplet text-info"></i>
                          <div class="spec-value">{{ property.bathrooms || 0 }}</div>
                          <div class="spec-label">Bathrooms</div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="spec-item text-center">
                          <i class="bi bi-arrows-fullscreen text-success"></i>
                          <div class="spec-value">{{ formatSquareFootage(property.square_footage) }}</div>
                          <div class="spec-label">Square Feet</div>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="spec-item text-center">
                          <i class="bi bi-car-front text-warning"></i>
                          <div class="spec-value">{{ property.parking_spaces || 0 }}</div>
                          <div class="spec-label">Parking</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="property.description" class="col-12">
                    <label class="form-label text-muted">Description</label>
                    <p class="mb-0" style="white-space: pre-wrap;">{{ property.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Amenities -->
            <div v-if="property.amenities && property.amenities.length > 0" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-star me-2"></i>
                  Amenities
                </h5>
              </div>
              <div class="card-body">
                <div class="row g-2">
                  <div
                    v-for="amenity in property.amenities"
                    :key="amenity"
                    class="col-md-6"
                  >
                    <div class="d-flex align-items-center">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      {{ formatAmenity(amenity) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pet Policy -->
            <div v-if="hasPetPolicy" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-heart me-2"></i>
                  Pet Policy
                </h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted">Pets Allowed</label>
                    <div class="d-flex align-items-center">
                      <i class="bi me-2" :class="property.pet_allowed ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'"></i>
                      {{ property.pet_allowed ? 'Yes' : 'No' }}
                    </div>
                  </div>
                  <div v-if="property.pet_allowed && property.pet_deposit" class="col-md-6">
                    <label class="form-label text-muted">Pet Deposit</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-currency-dollar me-2 text-muted"></i>
                      ${{ property.pet_deposit }}
                    </div>
                  </div>
                  <div v-if="property.pet_restrictions" class="col-12">
                    <label class="form-label text-muted">Pet Restrictions</label>
                    <p class="mb-0">{{ property.pet_restrictions }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Utilities -->
            <div v-if="hasUtilities" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-lightning me-2"></i>
                  Utilities
                </h5>
              </div>
              <div class="card-body">
                <div v-if="property.utilities_included && property.utilities_included.length > 0" class="mb-3">
                  <label class="form-label text-muted">Included Utilities</label>
                  <div class="row g-2">
                    <div
                      v-for="utility in property.utilities_included"
                      :key="utility"
                      class="col-md-6"
                    >
                      <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                        {{ formatUtility(utility) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="property.utilities_notes">
                  <label class="form-label text-muted">Utilities Notes</label>
                  <p class="mb-0">{{ property.utilities_notes }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <!-- Owner Information -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-person me-2"></i>
                  Property Owner
                </h5>
              </div>
              <div class="card-body">
                <div v-if="property.owner" class="d-flex align-items-center mb-3">
                  <div class="owner-avatar me-3">
                    {{ getOwnerInitials(property.owner) }}
                  </div>
                  <div>
                    <h6 class="mb-1">{{ getOwnerName(property.owner) }}</h6>
                    <small class="text-muted">Property Owner</small>
                  </div>
                </div>
                <div v-if="property.owner">
                  <div class="mb-2">
                    <i class="bi bi-envelope me-2 text-muted"></i>
                    <a :href="`mailto:${property.owner.email}`" class="text-decoration-none">
                      {{ property.owner.email }}
                    </a>
                  </div>
                  <div v-if="property.owner.phone" class="mb-2">
                    <i class="bi bi-telephone me-2 text-muted"></i>
                    <a :href="`tel:${property.owner.phone}`" class="text-decoration-none">
                      {{ formatPhone(property.owner.phone) }}
                    </a>
                  </div>
                </div>
                <div v-else class="text-muted">
                  <i class="bi bi-person-x me-2"></i>
                  No owner assigned
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-lightning me-2"></i>
                  Quick Actions
                </h5>
              </div>
              <div class="card-body">
                <div class="d-grid gap-2">
                  <router-link
                    :to="`/properties/${property.id}/edit`"
                    class="btn btn-outline-primary"
                  >
                    <i class="bi bi-pencil me-2"></i>
                    Edit Property
                  </router-link>
                  <div class="position-relative">
                    <router-link
                      :to="{ 
                        path: '/leases/new',
                        query: { 
                          propertyId: property.id,
                          ownerId: property.owner?.id 
                        }
                      }"
                      class="btn btn-outline-success w-100"
                      :class="{ disabled: !property.owner }"
                      :title="!property.owner ? 'Assign an owner to this property first' : 'Create a new lease for this property'"
                    >
                      <i class="bi bi-file-plus me-2"></i>
                      Create Lease
                    </router-link>
                  </div>
                  <button
                    v-if="property.owner"
                    @click="contactOwner"
                    class="btn btn-outline-info"
                  >
                    <i class="bi bi-chat me-2"></i>
                    Contact Owner
                  </button>
                  <button
                    @click="togglePropertyStatus"
                    class="btn"
                    :class="property.is_active ? 'btn-outline-warning' : 'btn-outline-success'"
                  >
                    <i class="bi me-2" :class="property.is_active ? 'bi-pause' : 'bi-play'"></i>
                    {{ property.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Property Statistics -->
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-graph-up me-2"></i>
                  Property Information
                </h5>
              </div>
              <div class="card-body">
                <div class="row g-3 text-center">
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <div class="h6 mb-1 text-primary">{{ formatDate(property.created_at) }}</div>
                      <small class="text-muted">Added</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <div class="h6 mb-1 text-success">{{ formatDate(property.updated_at) }}</div>
                      <small class="text-muted">Updated</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Owner Modal -->
    <div
      class="modal fade"
      id="contactOwnerModal"
      tabindex="-1"
      aria-labelledby="contactOwnerModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="contactOwnerModalLabel">Contact Owner</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="d-grid gap-2">
              <a
                v-if="property?.owner?.email"
                :href="`mailto:${property.owner.email}?subject=Regarding Property: ${property.title}`"
                class="btn btn-outline-primary"
              >
                <i class="bi bi-envelope me-2"></i>
                Send Email
              </a>
              <a
                v-if="property?.owner?.phone"
                :href="`tel:${property.owner.phone}`"
                class="btn btn-outline-success"
              >
                <i class="bi bi-telephone me-2"></i>
                Call {{ formatPhone(property.owner.phone) }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertyStore } from '@/stores/propertyStore'
import { format } from 'date-fns'
import { Modal } from 'bootstrap'

export default {
  name: 'PropertyDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const propertyStore = usePropertyStore()

    const property = computed(() => propertyStore.currentProperty)
    const loading = computed(() => propertyStore.loading)
    const error = ref(null)

    const hasPetPolicy = computed(() => {
      return property.value && (
        property.value.pet_allowed !== undefined ||
        property.value.pet_deposit ||
        property.value.pet_restrictions
      )
    })

    const hasUtilities = computed(() => {
      return property.value && (
        (property.value.utilities_included && property.value.utilities_included.length > 0) ||
        property.value.utilities_notes
      )
    })

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
      if (property.zip_code) parts.push(property.zip_code)
      return parts.join(', ')
    }

    const formatSquareFootage = (sqft) => {
      if (!sqft) return 'N/A'
      return `${sqft.toLocaleString()}`
    }

    const getOwnerName = (owner) => {
      if (!owner) return 'No Owner'
      return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unknown'
    }

    const getOwnerInitials = (owner) => {
      if (!owner) return 'NO'
      return `${owner.first_name?.charAt(0) || ''}${owner.last_name?.charAt(0) || ''}`.toUpperCase() || 'NO'
    }

    const formatPhone = (phone) => {
      if (!phone) return ''
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      }
      return phone
    }

    const formatDate = (date) => {
      if (!date) return ''
      return format(new Date(date), 'MMM dd, yyyy')
    }

    const formatAmenity = (amenity) => {
      return amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatUtility = (utility) => {
      return utility.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const contactOwner = () => {
      const modalElement = document.getElementById('contactOwnerModal')
      if (modalElement) {
        const modal = new Modal(modalElement)
        modal.show()
      }
    }

    const togglePropertyStatus = async () => {
      if (!property.value) return
      
      const action = property.value.is_active ? 'deactivate' : 'activate'
      const confirmed = confirm(`Are you sure you want to ${action} this property?`)
      
      if (!confirmed) return
      
      try {
        await propertyStore.updateProperty(property.value.id, {
          is_active: !property.value.is_active
        })
        // Reload the property to get updated data
        await loadProperty()
      } catch (error) {
        console.error('Error updating property status:', error)
        alert('Failed to update property status. Please try again.')
      }
    }

    const loadProperty = async () => {
      try {
        error.value = null
        await propertyStore.fetchProperty(route.params.id)
        if (!property.value) {
          error.value = 'Property not found'
        }
      } catch (err) {
        console.error('Error loading property:', err)
        error.value = 'Failed to load property details'
        // Don't redirect immediately, let user see the error and choose to go back
      }
    }

    onMounted(() => {
      loadProperty()
    })

    return {
      property,
      loading,
      error,
      hasPetPolicy,
      hasUtilities,
      formatPropertyType,
      formatAddress,
      formatSquareFootage,
      getOwnerName,
      getOwnerInitials,
      formatPhone,
      formatDate,
      formatAmenity,
      formatUtility,
      contactOwner,
      togglePropertyStatus
    }
  }
}
</script>

<style scoped>
.property-main-image {
  height: 400px;
  object-fit: cover;
}

@media (max-width: 768px) {
  .property-main-image {
    height: 250px;
  }
}

.no-image-placeholder {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

@media (max-width: 768px) {
  .no-image-placeholder {
    height: 250px;
  }
}

.property-specs {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

@media (max-width: 576px) {
  .property-specs {
    padding: 15px;
  }
}

.spec-item {
  padding: 15px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.spec-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 576px) {
  .spec-item {
    padding: 10px;
  }
}

.spec-item i {
  font-size: 2rem;
  margin-bottom: 10px;
}

@media (max-width: 576px) {
  .spec-item i {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
}

.spec-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #495057;
}

@media (max-width: 576px) {
  .spec-value {
    font-size: 1.25rem;
  }
}

.spec-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 5px;
}

.owner-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

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

.form-label {
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.carousel-control-prev,
.carousel-control-next {
  width: 5%;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.btn:disabled,
.btn.disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

/* Responsive utilities */
@media (max-width: 991px) {
  .col-lg-4 .card {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 576px) {
  .container-fluid {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .d-flex.gap-2 {
    flex-direction: column;
  }
  
  .d-flex.gap-2 .btn {
    margin-bottom: 0.5rem;
  }
}
</style>
