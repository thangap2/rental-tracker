<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-building-add me-2"></i>
            {{ isEdit ? 'Edit Property' : 'Add New Property' }}
          </h1>
          <router-link to="/properties" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>
            Back to Properties
          </router-link>
        </div>

        <div class="row">
          <div class="col-lg-8 mx-auto">
            <form @submit.prevent="handleSubmit">
              <!-- Basic Information -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-info-circle me-2"></i>
                    Basic Information
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12">
                      <label for="title" class="form-label">
                        Property Title <span class="text-danger">*</span>
                      </label>
                      <input
                        id="title"
                        v-model="form.title"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors.title }"
                        placeholder="Beautiful 2BR Apartment in Downtown"
                        required
                      >
                      <div v-if="errors.title" class="invalid-feedback">
                        {{ errors.title }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="propertyType" class="form-label">
                        Property Type <span class="text-danger">*</span>
                      </label>
                      <select
                        id="propertyType"
                        v-model="form.propertyType"
                        class="form-select"
                        :class="{ 'is-invalid': errors.propertyType }"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="duplex">Duplex</option>
                        <option value="studio">Studio</option>
                        <option value="other">Other</option>
                      </select>
                      <div v-if="errors.propertyType" class="invalid-feedback">
                        {{ errors.propertyType }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="owner" class="form-label">
                        Property Owner <span class="text-danger">*</span>
                      </label>
                      <select
                        id="owner"
                        v-model="form.owner"
                        class="form-select"
                        :class="{ 'is-invalid': errors.owner }"
                        required
                      >
                        <option value="">Select Owner</option>
                        <option v-for="contact in availableOwners" :key="contact.id" :value="contact.id">
                          {{ contact.first_name }} {{ contact.last_name }}
                        </option>
                      </select>
                      <div v-if="errors.owner" class="invalid-feedback">
                        {{ errors.owner }}
                      </div>
                      <div class="form-text">
                        <router-link to="/contacts/new" class="text-decoration-none">
                          <i class="bi bi-plus-circle me-1"></i>
                          Add new contact as owner
                        </router-link>
                      </div>
                    </div>
                    <div v-if="isEdit" class="col-md-6">
                      <label for="isActive" class="form-label">Status</label>
                      <select
                        id="isActive"
                        v-model="form.isActive"
                        class="form-select"
                      >
                        <option :value="true">Active</option>
                        <option :value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Address Information -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-geo-alt me-2"></i>
                    Address Information
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12">
                      <label for="street" class="form-label">
                        Street Address <span class="text-danger">*</span>
                      </label>
                      <input
                        id="street"
                        v-model="form.address.street"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors['address.street'] }"
                        placeholder="123 Main Street"
                        required
                      >
                      <div v-if="errors['address.street']" class="invalid-feedback">
                        {{ errors['address.street'] }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="city" class="form-label">
                        City <span class="text-danger">*</span>
                      </label>
                      <input
                        id="city"
                        v-model="form.address.city"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors['address.city'] }"
                        placeholder="New York"
                        required
                      >
                      <div v-if="errors['address.city']" class="invalid-feedback">
                        {{ errors['address.city'] }}
                      </div>
                    </div>
                    <div class="col-md-3">
                      <label for="state" class="form-label">
                        State <span class="text-danger">*</span>
                      </label>
                      <input
                        id="state"
                        v-model="form.address.state"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors['address.state'] }"
                        placeholder="NY"
                        maxlength="2"
                        required
                      >
                      <div v-if="errors['address.state']" class="invalid-feedback">
                        {{ errors['address.state'] }}
                      </div>
                    </div>
                    <div class="col-md-3">
                      <label for="zipCode" class="form-label">
                        ZIP Code <span class="text-danger">*</span>
                      </label>
                      <input
                        id="zipCode"
                        v-model="form.address.zipCode"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors['address.zipCode'] }"
                        placeholder="10001"
                        required
                      >
                      <div v-if="errors['address.zipCode']" class="invalid-feedback">
                        {{ errors['address.zipCode'] }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="country" class="form-label">Country</label>
                      <input
                        id="country"
                        v-model="form.address.country"
                        type="text"
                        class="form-control"
                        placeholder="USA"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Property Details -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-house me-2"></i>
                    Property Details
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-3">
                      <label for="bedrooms" class="form-label">Bedrooms</label>
                      <input
                        id="bedrooms"
                        v-model.number="form.bedrooms"
                        type="number"
                        class="form-control"
                        min="0"
                        max="20"
                        placeholder="2"
                      >
                    </div>
                    <div class="col-md-3">
                      <label for="bathrooms" class="form-label">Bathrooms</label>
                      <input
                        id="bathrooms"
                        v-model.number="form.bathrooms"
                        type="number"
                        class="form-control"
                        min="0"
                        max="20"
                        step="0.5"
                        placeholder="1.5"
                      >
                    </div>
                    <div class="col-md-3">
                      <label for="squareFootage" class="form-label">Square Footage</label>
                      <input
                        id="squareFootage"
                        v-model.number="form.squareFootage"
                        type="number"
                        class="form-control"
                        min="0"
                        placeholder="1200"
                      >
                    </div>
                    <div class="col-md-3">
                      <label for="yearBuilt" class="form-label">Year Built</label>
                      <input
                        id="yearBuilt"
                        v-model.number="form.yearBuilt"
                        type="number"
                        class="form-control"
                        :min="1800"
                        :max="new Date().getFullYear() + 1"
                        placeholder="2020"
                      >
                    </div>
                    <div class="col-md-6">
                      <label for="parkingSpaces" class="form-label">Parking Spaces</label>
                      <input
                        id="parkingSpaces"
                        v-model.number="form.parkingSpaces"
                        type="number"
                        class="form-control"
                        min="0"
                        max="20"
                        placeholder="1"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Amenities -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-star me-2"></i>
                    Amenities
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-2">
                    <div v-for="amenity in availableAmenities" :key="amenity" class="col-md-4 col-sm-6">
                      <div class="form-check">
                        <input
                          :id="`amenity-${amenity}`"
                          v-model="form.amenities"
                          class="form-check-input"
                          type="checkbox"
                          :value="amenity"
                        >
                        <label :for="`amenity-${amenity}`" class="form-check-label">
                          {{ amenity }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pet Policy -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-heart me-2"></i>
                    Pet Policy
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <div class="form-check form-switch">
                        <input
                          id="petAllowed"
                          v-model="form.petPolicy.allowed"
                          class="form-check-input"
                          type="checkbox"
                        >
                        <label for="petAllowed" class="form-check-label">
                          Pets Allowed
                        </label>
                      </div>
                    </div>
                    <div v-if="form.petPolicy.allowed" class="col-md-4">
                      <label for="petDeposit" class="form-label">Pet Deposit ($)</label>
                      <input
                        id="petDeposit"
                        v-model.number="form.petPolicy.deposit"
                        type="number"
                        class="form-control"
                        min="0"
                        step="0.01"
                        placeholder="500"
                      >
                    </div>
                    <div v-if="form.petPolicy.allowed" class="col-md-4">
                      <label for="petRestrictions" class="form-label">Pet Restrictions</label>
                      <input
                        id="petRestrictions"
                        v-model="form.petPolicy.restrictions"
                        type="text"
                        class="form-control"
                        placeholder="No aggressive breeds"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Utilities -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-lightning me-2"></i>
                    Utilities
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Utilities Included</label>
                      <div class="row g-2">
                        <div v-for="utility in availableUtilities" :key="utility" class="col-md-3 col-sm-6">
                          <div class="form-check">
                            <input
                              :id="`utility-${utility}`"
                              v-model="form.utilities.included"
                              class="form-check-input"
                              type="checkbox"
                              :value="utility"
                            >
                            <label :for="`utility-${utility}`" class="form-check-label">
                              {{ utility }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <label for="utilitiesNotes" class="form-label">Utilities Notes</label>
                      <textarea
                        id="utilitiesNotes"
                        v-model="form.utilities.notes"
                        class="form-control"
                        rows="2"
                        placeholder="Additional utility information..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-chat-text me-2"></i>
                    Description
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label for="description" class="form-label">Property Description</label>
                    <textarea
                      id="description"
                      v-model="form.description"
                      class="form-control"
                      rows="6"
                      placeholder="Describe the property, its features, location benefits, etc..."
                      maxlength="2000"
                    ></textarea>
                    <div class="form-text">
                      {{ form.description?.length || 0 }}/2000 characters
                    </div>
                  </div>
                </div>
              </div>

              <!-- Debug section (temporary) -->
              <div v-if="true" class="card mb-4 border-info">
                <div class="card-header bg-info bg-opacity-10">
                  <h6 class="card-title mb-0 text-info">
                    <i class="bi bi-bug me-2"></i>
                    Debug Information
                  </h6>
                </div>
                <div class="card-body">
                  <details>
                    <summary class="mb-2">Form Data</summary>
                    <pre class="small">{{ JSON.stringify(form, null, 2) }}</pre>
                  </details>
                  <details v-if="Object.keys(errors).length > 0">
                    <summary class="mb-2 text-danger">Validation Errors</summary>
                    <pre class="small text-danger">{{ JSON.stringify(errors, null, 2) }}</pre>
                  </details>
                  <div class="mt-2">
                    <small class="text-muted">
                      Form Valid: {{ isFormValid ? '✅' : '❌' }} | 
                      Owner Selected: {{ form.owner ? '✅' : '❌' }} |
                      Required Fields: {{ 
                        form.title && form.propertyType && form.owner && 
                        form.address.street && form.address.city && 
                        form.address.state && form.address.zipCode ? '✅' : '❌' 
                      }}
                    </small>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="card">
                <div class="card-body">
                  <div class="d-flex justify-content-end gap-2">
                    <router-link to="/properties" class="btn btn-outline-secondary">
                      Cancel
                    </router-link>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="loading || !isFormValid"
                    >
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-check-lg me-2"></i>
                      {{ isEdit ? 'Update Property' : 'Create Property' }}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertyStore } from '@/stores/propertyStore'
import { useContactStore } from '@/stores/contactStore'

export default {
  name: 'PropertyForm',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const propertyStore = usePropertyStore()
    const contactStore = useContactStore()

    const isEdit = computed(() => !!route.params.id)
    const { loading } = propertyStore

    const form = ref({
      title: '',
      propertyType: '',
      owner: '',
      isActive: true,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      bedrooms: 0,
      bathrooms: 0,
      squareFootage: null,
      yearBuilt: null,
      parkingSpaces: 0,
      amenities: [],
      petPolicy: {
        allowed: false,
        deposit: null,
        restrictions: ''
      },
      utilities: {
        included: [],
        notes: ''
      },
      description: ''
    })

    const errors = ref({})
    const availableOwners = ref([])

    const availableAmenities = [
      'Air Conditioning',
      'Heating',
      'Dishwasher',
      'Washer/Dryer',
      'Balcony/Patio',
      'Swimming Pool',
      'Gym/Fitness Center',
      'Parking',
      'Storage',
      'Fireplace',
      'Hardwood Floors',
      'Carpet',
      'Tile Floors',
      'Walk-in Closet',
      'Garden',
      'Elevator',
      'Doorman',
      'Security System',
      'Internet/WiFi',
      'Cable TV'
    ]

    const availableUtilities = [
      'Electricity',
      'Gas',
      'Water',
      'Sewer',
      'Trash',
      'Internet',
      'Cable TV',
      'Heating',
      'Air Conditioning'
    ]

    const isFormValid = computed(() => {
      return form.value.title && 
             form.value.propertyType && 
             form.value.owner &&
             form.value.address.street &&
             form.value.address.city &&
             form.value.address.state &&
             form.value.address.zipCode &&
             Object.keys(errors.value).length === 0
    })

    const validateForm = () => {
      errors.value = {}

      // Required field validation
      if (!form.value.title?.trim()) {
        errors.value.title = 'Property title is required'
      } else if (form.value.title.length > 100) {
        errors.value.title = 'Title cannot be more than 100 characters'
      }

      if (!form.value.propertyType) {
        errors.value.propertyType = 'Property type is required'
      }

      if (!form.value.owner) {
        errors.value.owner = 'Property owner is required'
      }

      // Address validation
      if (!form.value.address.street?.trim()) {
        errors.value['address.street'] = 'Street address is required'
      }

      if (!form.value.address.city?.trim()) {
        errors.value['address.city'] = 'City is required'
      }

      if (!form.value.address.state?.trim()) {
        errors.value['address.state'] = 'State is required'
      }

      if (!form.value.address.zipCode?.trim()) {
        errors.value['address.zipCode'] = 'ZIP code is required'
      }

      // Optional field validation
      if (form.value.bedrooms < 0 || form.value.bedrooms > 20) {
        errors.value.bedrooms = 'Bedrooms must be between 0 and 20'
      }

      if (form.value.bathrooms < 0 || form.value.bathrooms > 20) {
        errors.value.bathrooms = 'Bathrooms must be between 0 and 20'
      }

      if (form.value.squareFootage && form.value.squareFootage < 0) {
        errors.value.squareFootage = 'Square footage must be positive'
      }

      if (form.value.yearBuilt && (form.value.yearBuilt < 1800 || form.value.yearBuilt > new Date().getFullYear() + 1)) {
        errors.value.yearBuilt = `Year built must be between 1800 and ${new Date().getFullYear() + 1}`
      }

      if (form.value.parkingSpaces < 0) {
        errors.value.parkingSpaces = 'Parking spaces must be positive'
      }

      console.log('Form validation result:', {
        hasErrors: Object.keys(errors.value).length > 0,
        errors: errors.value,
        formData: form.value
      })

      return Object.keys(errors.value).length === 0
    }

    const loadProperty = async () => {
      if (isEdit.value) {
        try {
          await propertyStore.fetchProperty(route.params.id)
          const property = propertyStore.currentProperty
          
          if (property) {
            form.value = {
              title: property.title || '',
              propertyType: property.property_type || '',
              owner: property.owner_id || '',
              isActive: property.is_active !== false,
              address: {
                street: property.street || '',
                city: property.city || '',
                state: property.state || '',
                zipCode: property.zip_code || '',
                country: property.country || 'USA'
              },
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              squareFootage: property.square_footage || null,
              yearBuilt: property.year_built || null,
              parkingSpaces: property.parking_spaces || 0,
              amenities: property.amenities || [],
              petPolicy: {
                allowed: property.pet_allowed || false,
                deposit: property.pet_deposit || null,
                restrictions: property.pet_restrictions || ''
              },
              utilities: {
                included: property.utilities_included || [],
                notes: property.utilities_notes || ''
              },
              description: property.description || ''
            }
          }
        } catch (error) {
          console.error('Error loading property:', error)
          router.push('/properties')
        }
      }
    }

    const loadOwners = async () => {
      try {
        // Fetch all contacts who can be property owners
        await contactStore.fetchContacts({ limit: 100, isActive: 'true' })
        availableOwners.value = contactStore.contacts
      } catch (error) {
        console.error('Error loading owners:', error)
      }
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        console.log('Form validation failed:', errors.value)
        return
      }

      // Prepare the data and ensure proper types
      const propertyData = {
        ...form.value,
        bedrooms: Number(form.value.bedrooms) || 0,
        bathrooms: Number(form.value.bathrooms) || 0,
        squareFootage: form.value.squareFootage ? Number(form.value.squareFootage) : null,
        yearBuilt: form.value.yearBuilt ? Number(form.value.yearBuilt) : null,
        parkingSpaces: Number(form.value.parkingSpaces) || 0,
        petPolicy: {
          allowed: form.value.petPolicy.allowed,
          deposit: form.value.petPolicy.allowed && form.value.petPolicy.deposit ? 
                   Number(form.value.petPolicy.deposit) : null,
          restrictions: form.value.petPolicy.allowed ? form.value.petPolicy.restrictions : ''
        }
      }

      console.log('Submitting form data:', propertyData)

      try {
        if (isEdit.value) {
          await propertyStore.updateProperty(route.params.id, propertyData)
        } else {
          await propertyStore.createProperty(propertyData)
        }
        
        router.push('/properties')
      } catch (error) {
        console.error('Error saving property:', error)
        // Check if it's a validation error and update the form errors
        if (error.response?.data?.errors) {
          const backendErrors = {}
          error.response.data.errors.forEach(err => {
            backendErrors[err.path || err.param] = err.msg
          })
          errors.value = { ...errors.value, ...backendErrors }
        }
      }
    }

    // Watch form fields for validation
    watch(() => form.value.title, validateForm)
    watch(() => form.value.propertyType, validateForm)
    watch(() => form.value.owner, validateForm)
    watch(() => form.value.address.street, validateForm)
    watch(() => form.value.address.city, validateForm)
    watch(() => form.value.address.state, validateForm)
    watch(() => form.value.address.zipCode, validateForm)

    onMounted(() => {
      loadOwners()
      loadProperty()
    })

    return {
      isEdit,
      loading,
      form,
      errors,
      availableOwners,
      availableAmenities,
      availableUtilities,
      isFormValid,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.text-danger {
  color: #dc3545 !important;
}

.invalid-feedback {
  display: block;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-switch .form-check-input {
  width: 2em;
  margin-left: -2.5em;
}
</style>
