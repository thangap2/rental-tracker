<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-person-plus me-2"></i>
            {{ isEdit ? 'Edit Contact' : 'Add New Contact' }}
          </h1>
          <router-link to="/contacts" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>
            Back to Contacts
          </router-link>
        </div>

        <div class="row">
          <div class="col-lg-8 mx-auto">
            <form @submit.prevent="handleSubmit">
              <!-- Personal Information -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-person me-2"></i>
                    Personal Information
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="firstName" class="form-label">
                        First Name <span class="text-danger">*</span>
                      </label>
                      <input
                        id="firstName"
                        v-model="form.firstName"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors.firstName }"
                        required
                      >
                      <div v-if="errors.firstName" class="invalid-feedback">
                        {{ errors.firstName }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="lastName" class="form-label">
                        Last Name <span class="text-danger">*</span>
                      </label>
                      <input
                        id="lastName"
                        v-model="form.lastName"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errors.lastName }"
                        required
                      >
                      <div v-if="errors.lastName" class="invalid-feedback">
                        {{ errors.lastName }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="email" class="form-label">
                        Email <span class="text-danger">*</span>
                      </label>
                      <input
                        id="email"
                        v-model="form.email"
                        type="email"
                        class="form-control"
                        :class="{ 'is-invalid': errors.email }"
                        maxlength="255"
                        required
                      >
                      <div v-if="errors.email" class="invalid-feedback">
                        {{ errors.email }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="phone" class="form-label">
                        Phone <span class="text-danger">*</span>
                      </label>
                      <input
                        id="phone"
                        v-model="form.phone"
                        type="tel"
                        class="form-control"
                        :class="{ 'is-invalid': errors.phone }"
                        placeholder="(555) 123-4567"
                        required
                      >
                      <div v-if="errors.phone" class="invalid-feedback">
                        {{ errors.phone }}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="alternatePhone" class="form-label">Alternate Phone</label>
                      <input
                        id="alternatePhone"
                        v-model="form.alternatePhone"
                        type="tel"
                        class="form-control"
                        placeholder="(555) 123-4567"
                      >
                    </div>
                    <div class="col-md-6">
                      <label for="contactType" class="form-label">Contact Type</label>
                      <select
                        id="contactType"
                        v-model="form.contactType"
                        class="form-select"
                      >
                        <option value="tenant">Tenant</option>
                        <option value="landlord">Landlord</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="preferredContactMethod" class="form-label">Preferred Contact Method</label>
                      <select
                        id="preferredContactMethod"
                        v-model="form.preferredContactMethod"
                        class="form-select"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="text">Text</option>
                      </select>
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
                      <label for="street" class="form-label">Street Address</label>
                      <input
                        id="street"
                        v-model="form.address.street"
                        type="text"
                        class="form-control"
                        placeholder="123 Main Street"
                      >
                    </div>
                    <div class="col-md-6">
                      <label for="city" class="form-label">City</label>
                      <input
                        id="city"
                        v-model="form.address.city"
                        type="text"
                        class="form-control"
                        placeholder="New York"
                      >
                    </div>
                    <div class="col-md-3">
                      <label for="state" class="form-label">State</label>
                      <input
                        id="state"
                        v-model="form.address.state"
                        type="text"
                        class="form-control"
                        placeholder="NY"
                        maxlength="2"
                      >
                    </div>
                    <div class="col-md-3">
                      <label for="zipCode" class="form-label">ZIP Code</label>
                      <input
                        id="zipCode"
                        v-model="form.address.zipCode"
                        type="text"
                        class="form-control"
                        placeholder="10001"
                      >
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

              <!-- Emergency Contact -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-person-exclamation me-2"></i>
                    Emergency Contact
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="emergencyContactName" class="form-label">Name</label>
                      <input
                        id="emergencyContactName"
                        v-model="form.emergencyContact.name"
                        type="text"
                        class="form-control"
                        placeholder="John Doe"
                      >
                    </div>
                    <div class="col-md-6">
                      <label for="emergencyContactPhone" class="form-label">Phone</label>
                      <input
                        id="emergencyContactPhone"
                        v-model="form.emergencyContact.phone"
                        type="tel"
                        class="form-control"
                        placeholder="(555) 123-4567"
                      >
                    </div>
                    <div class="col-md-6">
                      <label for="emergencyContactRelationship" class="form-label">Relationship</label>
                      <input
                        id="emergencyContactRelationship"
                        v-model="form.emergencyContact.relationship"
                        type="text"
                        class="form-control"
                        placeholder="Spouse, Parent, etc."
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="bi bi-chat-text me-2"></i>
                    Notes
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label for="notes" class="form-label">Additional Notes</label>
                    <textarea
                      id="notes"
                      v-model="form.notes"
                      class="form-control"
                      rows="4"
                      placeholder="Any additional information about the contact..."
                      maxlength="1000"
                    ></textarea>
                    <div class="form-text">
                      {{ form.notes?.length || 0 }}/1000 characters
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="card">
                <div class="card-body">
                  <div class="d-flex justify-content-end gap-2">
                    <router-link to="/contacts" class="btn btn-outline-secondary">
                      Cancel
                    </router-link>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="loading || !isFormValid"
                    >
                      <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-check-lg me-2"></i>
                      {{ isEdit ? 'Update Contact' : 'Create Contact' }}
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
import { useContactStore } from '@/stores/contactStore'

export default {
  name: 'ContactForm',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const contactStore = useContactStore()

    const isEdit = computed(() => !!route.params.id)
    const { loading } = contactStore

    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      contactType: 'tenant',
      preferredContactMethod: 'email',
      isActive: true,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      notes: ''
    })

    const errors = ref({})

    const isFormValid = computed(() => {
      return form.value.firstName && 
             form.value.lastName && 
             form.value.email && 
             form.value.phone &&
             Object.keys(errors.value).length === 0
    })

    const validateForm = () => {
      errors.value = {}

      if (!form.value.firstName?.trim()) {
        errors.value.firstName = 'First name is required'
      } else if (form.value.firstName.length > 50) {
        errors.value.firstName = 'First name cannot be more than 50 characters'
      }

      if (!form.value.lastName?.trim()) {
        errors.value.lastName = 'Last name is required'
      } else if (form.value.lastName.length > 50) {
        errors.value.lastName = 'Last name cannot be more than 50 characters'
      }

      if (!form.value.email?.trim()) {
        errors.value.email = 'Email is required'
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.value.email)) {
        errors.value.email = 'Please enter a valid email address'
      }

      if (!form.value.phone?.trim()) {
        errors.value.phone = 'Phone number is required'
      }

      return Object.keys(errors.value).length === 0
    }

    const loadContact = async () => {
      if (isEdit.value) {
        try {
          await contactStore.fetchContact(route.params.id)
          const contact = contactStore.currentContact
          
          if (contact) {
            form.value = {
              firstName: contact.first_name || '',
              lastName: contact.last_name || '',
              email: contact.email || '',
              phone: contact.phone || '',
              alternatePhone: contact.alternate_phone || '',
              contactType: contact.contact_type || 'tenant',
              preferredContactMethod: contact.preferred_contact_method || 'email',
              isActive: contact.is_active !== false,
              address: {
                street: contact.street || '',
                city: contact.city || '',
                state: contact.state || '',
                zipCode: contact.zip_code || '',
                country: contact.country || 'USA'
              },
              emergencyContact: {
                name: contact.emergency_contact_name || '',
                phone: contact.emergency_contact_phone || '',
                relationship: contact.emergency_contact_relationship || ''
              },
              notes: contact.notes || ''
            }
          }
        } catch (error) {
          console.error('Error loading contact:', error)
          router.push('/contacts')
        }
      }
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      try {
        if (isEdit.value) {
          await contactStore.updateContact(route.params.id, form.value)
        } else {
          await contactStore.createContact(form.value)
        }
        
        router.push('/contacts')
      } catch (error) {
        console.error('Error saving contact:', error)
      }
    }

    // Watch form fields for validation
    watch(() => form.value.firstName, validateForm)
    watch(() => form.value.lastName, validateForm)
    watch(() => form.value.email, validateForm)
    watch(() => form.value.phone, validateForm)

    onMounted(() => {
      loadContact()
    })

    return {
      isEdit,
      loading,
      form,
      errors,
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
</style>
