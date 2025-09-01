<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-person me-2"></i>
            Contact Details
          </h1>
          <div class="d-flex gap-2">
            <router-link
              v-if="contact"
              :to="`/contacts/${contact.id}/edit`"
              class="btn btn-primary"
            >
              <i class="bi bi-pencil me-2"></i>
              Edit Contact
            </router-link>
            <router-link to="/contacts" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-2"></i>
              Back to Contacts
            </router-link>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading contact details...</p>
        </div>

        <div v-else-if="!contact" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-muted"></i>
          <h4 class="mt-3">Contact Not Found</h4>
          <p class="text-muted">The requested contact could not be found.</p>
          <router-link to="/contacts" class="btn btn-primary">
            Back to Contacts
          </router-link>
        </div>

        <div v-else class="row">
          <div class="col-lg-8">
            <!-- Personal Information -->
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">
                  <i class="bi bi-person me-2"></i>
                  Personal Information
                </h5>
                <span class="badge" :class="contact.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ contact.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="d-flex align-items-center mb-3">
                      <div class="avatar-circle me-3">
                        {{ getInitials(contact.first_name, contact.last_name) }}
                      </div>
                      <div>
                        <h4 class="mb-0">{{ contact.first_name }} {{ contact.last_name }}</h4>
                        <span class="badge" :class="getContactTypeBadge(contact.contact_type)">
                          {{ formatContactType(contact.contact_type) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted">Email</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-envelope me-2 text-muted"></i>
                      <a :href="`mailto:${contact.email}`" class="text-decoration-none">
                        {{ contact.email }}
                      </a>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Phone</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-telephone me-2 text-muted"></i>
                      <a :href="`tel:${contact.phone}`" class="text-decoration-none">
                        {{ formatPhone(contact.phone) }}
                      </a>
                    </div>
                  </div>
                  <div v-if="contact.alternate_phone" class="col-md-6">
                    <label class="form-label text-muted">Alternate Phone</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-telephone me-2 text-muted"></i>
                      <a :href="`tel:${contact.alternate_phone}`" class="text-decoration-none">
                        {{ formatPhone(contact.alternate_phone) }}
                      </a>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Preferred Contact</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-chat me-2 text-muted"></i>
                      {{ formatContactMethod(contact.preferred_contact_method) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Address Information -->
            <div v-if="hasAddress" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-geo-alt me-2"></i>
                  Address Information
                </h5>
              </div>
              <div class="card-body">
                <div class="d-flex align-items-start">
                  <i class="bi bi-house me-2 text-muted mt-1"></i>
                  <div>
                    <div v-if="contact.street">{{ contact.street }}</div>
                    <div>
                      <span v-if="contact.city">{{ contact.city }}</span>
                      <span v-if="contact.city && contact.state">, </span>
                      <span v-if="contact.state">{{ contact.state }}</span>
                      <span v-if="contact.zip_code"> {{ contact.zip_code }}</span>
                    </div>
                    <div v-if="contact.country && contact.country !== 'USA'">{{ contact.country }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Emergency Contact -->
            <div v-if="hasEmergencyContact" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-person-exclamation me-2"></i>
                  Emergency Contact
                </h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted">Name</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-person me-2 text-muted"></i>
                      {{ contact.emergency_contact_name }}
                    </div>
                  </div>
                  <div v-if="contact.emergency_contact_phone" class="col-md-6">
                    <label class="form-label text-muted">Phone</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-telephone me-2 text-muted"></i>
                      <a :href="`tel:${contact.emergency_contact_phone}`" class="text-decoration-none">
                        {{ formatPhone(contact.emergency_contact_phone) }}
                      </a>
                    </div>
                  </div>
                  <div v-if="contact.emergency_contact_relationship" class="col-md-6">
                    <label class="form-label text-muted">Relationship</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-heart me-2 text-muted"></i>
                      {{ contact.emergency_contact_relationship }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="contact.notes" class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-chat-text me-2"></i>
                  Notes
                </h5>
              </div>
              <div class="card-body">
                <p class="mb-0" style="white-space: pre-wrap;">{{ contact.notes }}</p>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
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
                  <a
                    :href="`mailto:${contact.email}`"
                    class="btn btn-outline-primary"
                  >
                    <i class="bi bi-envelope me-2"></i>
                    Send Email
                  </a>
                  <a
                    :href="`tel:${contact.phone}`"
                    class="btn btn-outline-success"
                  >
                    <i class="bi bi-telephone me-2"></i>
                    Call Primary
                  </a>
                  <a
                    v-if="contact.alternate_phone"
                    :href="`tel:${contact.alternate_phone}`"
                    class="btn btn-outline-success"
                  >
                    <i class="bi bi-telephone me-2"></i>
                    Call Alternate
                  </a>
                  <router-link
                    :to="`/contacts/${contact.id}/edit`"
                    class="btn btn-outline-secondary"
                  >
                    <i class="bi bi-pencil me-2"></i>
                    Edit Contact
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Contact Statistics -->
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="bi bi-graph-up me-2"></i>
                  Contact Information
                </h5>
              </div>
              <div class="card-body">
                <div class="row g-3 text-center">
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <div class="h4 mb-1 text-primary">{{ formatDate(contact.created_at) }}</div>
                      <small class="text-muted">Contact Since</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <div class="h4 mb-1 text-success">{{ formatDate(contact.updated_at) }}</div>
                      <small class="text-muted">Last Updated</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contactStore'
import { format } from 'date-fns'

export default {
  name: 'ContactDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const contactStore = useContactStore()

    const { currentContact: contact, loading } = contactStore

    const hasAddress = computed(() => {
      return contact.value && (
        contact.value.street ||
        contact.value.city ||
        contact.value.state ||
        contact.value.zip_code ||
        (contact.value.country && contact.value.country !== 'USA')
      )
    })

    const hasEmergencyContact = computed(() => {
      return contact.value && (
        contact.value.emergency_contact_name ||
        contact.value.emergency_contact_phone ||
        contact.value.emergency_contact_relationship
      )
    })

    const getInitials = (firstName, lastName) => {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
    }

    const formatPhone = (phone) => {
      if (!phone) return ''
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      }
      return phone
    }

    const formatContactType = (type) => {
      const types = {
        tenant: 'Tenant',
        landlord: 'Landlord',
        both: 'Both'
      }
      return types[type] || type
    }

    const getContactTypeBadge = (type) => {
      const badges = {
        tenant: 'bg-primary',
        landlord: 'bg-success',
        both: 'bg-info'
      }
      return badges[type] || 'bg-secondary'
    }

    const formatContactMethod = (method) => {
      const methods = {
        email: 'Email',
        phone: 'Phone',
        text: 'Text Message'
      }
      return methods[method] || method
    }

    const formatDate = (date) => {
      if (!date) return ''
      return format(new Date(date), 'MMM dd, yyyy')
    }

    const loadContact = async () => {
      try {
        await contactStore.fetchContact(route.params.id)
      } catch (error) {
        console.error('Error loading contact:', error)
        router.push('/contacts')
      }
    }

    onMounted(() => {
      loadContact()
    })

    return {
      contact,
      loading,
      hasAddress,
      hasEmergencyContact,
      getInitials,
      formatPhone,
      formatContactType,
      getContactTypeBadge,
      formatContactMethod,
      formatDate
    }
  }
}
</script>

<style scoped>
.avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 20px;
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
</style>
