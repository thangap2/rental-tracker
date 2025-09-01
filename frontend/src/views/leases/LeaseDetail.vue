<template>
  <div class="container-fluid py-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading lease details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-5">
      <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
      <h4 class="mt-3 text-danger">Error Loading Lease</h4>
      <p class="text-muted">{{ error }}</p>
      <button @click="goBack" class="btn btn-primary">
        <i class="bi bi-arrow-left me-1"></i>
        Back to Leases
      </button>
    </div>

    <!-- Main Content -->
    <div v-else-if="lease">
      <!-- Header Section -->
      <div class="row mb-4">
        <div class="col-md-6">
          <h1 class="h3 mb-0">
            <i class="bi bi-file-text me-2"></i>
            Lease Details
          </h1>
          <p class="text-muted">{{ property?.title || (property?.street + ', ' + property?.city) || 'Unknown Property' }}</p>
        </div>
        <div class="col-md-6 text-md-end">
          <button @click="goBack" class="btn btn-outline-secondary me-2">
            <i class="bi bi-arrow-left me-1"></i>
            Back to Leases
          </button>
          <button @click="editLease" class="btn btn-primary me-2">
            <i class="bi bi-pencil me-1"></i>
            Edit Lease
          </button>
          <button 
            @click="showDeleteModal = true" 
            class="btn btn-outline-danger"
            :disabled="lease.status === 'active'"
          >
            <i class="bi bi-trash me-1"></i>
            Delete
          </button>
        </div>
      </div>

      <div class="row">
        <!-- Main Information -->
        <div class="col-lg-8">
          <!-- Lease Status Card -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-info-circle me-2"></i>
                Lease Status
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 mb-3">
                  <h6 class="text-muted mb-1">Current Status</h6>
                  <span :class="getStatusBadgeClass(lease.status)" class="fs-6">
                    {{ lease.status.charAt(0).toUpperCase() + lease.status.slice(1) }}
                  </span>
                </div>
                <div class="col-md-3 mb-3">
                  <h6 class="text-muted mb-1">Days Remaining</h6>
                  <p class="mb-0 fw-bold" :class="getDaysRemainingClass()">
                    {{ daysRemaining }}
                  </p>
                </div>
                <div class="col-md-3 mb-3">
                  <h6 class="text-muted mb-1">Progress</h6>
                  <div class="progress">
                    <div 
                      class="progress-bar" 
                      :class="getProgressBarClass()"
                      :style="{ width: progressPercentage + '%' }"
                    ></div>
                  </div>
                  <small class="text-muted">{{ progressPercentage.toFixed(1) }}% complete</small>
                </div>
                <div class="col-md-3 mb-3">
                  <h6 class="text-muted mb-1">Total Duration</h6>
                  <p class="mb-0">{{ totalDuration }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Information Card -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-calendar-range me-2"></i>
                Lease Information
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Start Date</h6>
                  <p class="mb-0">{{ formatDate(lease.start_date) }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">End Date</h6>
                  <p class="mb-0">{{ formatDate(lease.end_date) }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Monthly Rent</h6>
                  <p class="mb-0 fs-4 fw-bold text-success">${{ formatCurrency(lease.monthly_rent) }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Security Deposit</h6>
                  <p class="mb-0 fs-5">${{ formatCurrency(lease.security_deposit) }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Lease Term</h6>
                  <p class="mb-0">{{ totalDuration }}</p>
                </div>
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Created</h6>
                  <p class="mb-0">{{ formatDate(lease.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Property Information Card -->
          <div v-if="property" class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-house me-2"></i>
                Property Information
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-12 mb-3">
                  <h6 class="text-muted mb-1">Address</h6>
                  <p class="mb-0">{{ property.title || (property.street + ', ' + property.city) }}</p>
                  <small class="text-muted">{{ property.city }}, {{ property.state }} {{ property.zip_code }}</small>
                </div>
                <div class="col-md-4 mb-3" v-if="property.property_type">
                  <h6 class="text-muted mb-1">Type</h6>
                  <p class="mb-0">{{ property.property_type }}</p>
                </div>
                <div class="col-md-4 mb-3" v-if="property.bedrooms">
                  <h6 class="text-muted mb-1">Bedrooms</h6>
                  <p class="mb-0">{{ property.bedrooms }}</p>
                </div>
                <div class="col-md-4 mb-3" v-if="property.bathrooms">
                  <h6 class="text-muted mb-1">Bathrooms</h6>
                  <p class="mb-0">{{ property.bathrooms }}</p>
                </div>
              </div>
              <div class="mt-2">
                <router-link 
                  :to="`/properties/${property.id}`" 
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="bi bi-eye me-1"></i>
                  View Property Details
                </router-link>
              </div>
            </div>
          </div>

          <!-- Tenant Information Card -->
          <div v-if="tenant" class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-person me-2"></i>
                Tenant Information
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Name</h6>
                  <p class="mb-0">{{ tenant.first_name }} {{ tenant.last_name }}</p>
                </div>
                <div class="col-md-6 mb-3" v-if="tenant.email">
                  <h6 class="text-muted mb-1">Email</h6>
                  <p class="mb-0">
                    <a :href="`mailto:${tenant.email}`" class="text-decoration-none">
                      {{ tenant.email }}
                    </a>
                  </p>
                </div>
                <div class="col-md-6 mb-3" v-if="tenant.phone">
                  <h6 class="text-muted mb-1">Phone</h6>
                  <p class="mb-0">
                    <a :href="`tel:${tenant.phone}`" class="text-decoration-none">
                      {{ tenant.phone }}
                    </a>
                  </p>
                </div>
                <div class="col-md-6 mb-3" v-if="tenant.emergency_contact">
                  <h6 class="text-muted mb-1">Emergency Contact</h6>
                  <p class="mb-0">{{ tenant.emergency_contact }}</p>
                </div>
              </div>
              <div class="mt-2">
                <router-link 
                  :to="`/contacts/${tenant.id}`" 
                  class="btn btn-outline-primary btn-sm me-2"
                >
                  <i class="bi bi-eye me-1"></i>
                  View Details
                </router-link>
                <button 
                  @click="showEmailComposer"
                  class="btn btn-outline-success btn-sm"
                >
                  <i class="bi bi-envelope me-1"></i>
                  Send Email
                </button>
              </div>
            </div>
          </div>

          <!-- Landlord Information Card -->
          <div v-if="landlord" class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-building me-2"></i>
                Landlord Information
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <h6 class="text-muted mb-1">Name</h6>
                  <p class="mb-0">{{ landlord.first_name }} {{ landlord.last_name }}</p>
                </div>
                <div class="col-md-6 mb-3" v-if="landlord.email">
                  <h6 class="text-muted mb-1">Email</h6>
                  <p class="mb-0">
                    <a :href="`mailto:${landlord.email}`" class="text-decoration-none">
                      {{ landlord.email }}
                    </a>
                  </p>
                </div>
                <div class="col-md-6 mb-3" v-if="landlord.phone">
                  <h6 class="text-muted mb-1">Phone</h6>
                  <p class="mb-0">
                    <a :href="`tel:${landlord.phone}`" class="text-decoration-none">
                      {{ landlord.phone }}
                    </a>
                  </p>
                </div>
                <div class="col-md-6 mb-3" v-if="landlord.alternate_phone">
                  <h6 class="text-muted mb-1">Alternate Phone</h6>
                  <p class="mb-0">
                    <a :href="`tel:${landlord.alternate_phone}`" class="text-decoration-none">
                      {{ landlord.alternate_phone }}
                    </a>
                  </p>
                </div>
              </div>
              <div class="mt-2">
                <router-link 
                  :to="`/contacts/${landlord.id}`" 
                  class="btn btn-outline-primary btn-sm me-2"
                >
                  <i class="bi bi-eye me-1"></i>
                  View Details
                </router-link>
                <button 
                  @click="showEmailComposer"
                  class="btn btn-outline-success btn-sm"
                >
                  <i class="bi bi-envelope me-1"></i>
                  Send Email
                </button>
              </div>
            </div>
          </div>

          <!-- Notes Card -->
          <div v-if="lease.notes" class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-file-text me-2"></i>
                Notes
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-0" style="white-space: pre-wrap;">{{ lease.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Quick Actions Card -->
          <div class="card mb-4 position-sticky" style="top: 2rem;">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button @click="editLease" class="btn btn-primary">
                  <i class="bi bi-pencil me-2"></i>
                  Edit Lease
                </button>
                
                <button 
                  v-if="lease.status === 'pending'"
                  @click="updateStatus('active')"
                  class="btn btn-success"
                >
                  <i class="bi bi-check-circle me-2"></i>
                  Activate Lease
                </button>
                
                <button 
                  v-if="lease.status === 'active'"
                  @click="updateStatus('terminated')"
                  class="btn btn-warning"
                >
                  <i class="bi bi-x-circle me-2"></i>
                  Terminate Lease
                </button>
                
                <hr class="my-3">
                
                <button class="btn btn-outline-primary">
                  <i class="bi bi-file-earmark-pdf me-2"></i>
                  Generate PDF
                </button>
                
                <div class="btn-group" role="group">
                  <button 
                    @click="showEmailComposer"
                    class="btn btn-outline-primary"
                  >
                    <i class="bi bi-envelope me-2"></i>
                    Send Email
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary dropdown-toggle dropdown-toggle-split" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span class="visually-hidden">Toggle Dropdown</span>
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <a 
                        class="dropdown-item" 
                        href="#" 
                        @click.prevent="showEmailComposer"
                      >
                        <i class="bi bi-envelope me-2"></i>
                        Compose New Email
                      </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <a 
                        class="dropdown-item" 
                        href="#" 
                        @click.prevent="emailTenant"
                        v-if="tenant?.email"
                      >
                        <i class="bi bi-person me-2"></i>
                        Email Tenant
                      </a>
                    </li>
                    <li>
                      <a 
                        class="dropdown-item" 
                        href="#" 
                        @click.prevent="emailLandlord"
                        v-if="landlord?.email"
                      >
                        <i class="bi bi-building me-2"></i>
                        Email Landlord
                      </a>
                    </li>
                    <li>
                      <a 
                        class="dropdown-item" 
                        href="#" 
                        @click.prevent="emailAllParties"
                        v-if="(tenant?.email || landlord?.email)"
                      >
                        <i class="bi bi-people me-2"></i>
                        Email All Parties
                      </a>
                    </li>
                  </ul>
                </div>

                <button 
                  @click="sendLeaseReminder"
                  class="btn btn-outline-warning"
                  v-if="lease.status === 'active'"
                >
                  <i class="bi bi-bell me-2"></i>
                  Send Lease Reminder
                </button>
                
                <hr class="my-3">
                
                <button 
                  @click="showDeleteModal = true" 
                  class="btn btn-outline-danger"
                  :disabled="lease.status === 'active'"
                >
                  <i class="bi bi-trash me-2"></i>
                  Delete Lease
                </button>
              </div>
              
              <div v-if="lease.status === 'active'" class="mt-3">
                <small class="text-warning">
                  <i class="bi bi-info-circle me-1"></i>
                  Active leases cannot be deleted
                </small>
              </div>
            </div>
          </div>

          <!-- Financial Summary Card -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="bi bi-calculator me-2"></i>
                Financial Summary
              </h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <h6 class="text-muted mb-1">Total Rent (Full Term)</h6>
                <p class="mb-0 fs-5 fw-bold text-success">${{ formatCurrency(totalRent) }}</p>
              </div>
              
              <div class="mb-3">
                <h6 class="text-muted mb-1">Rent Collected (to date)</h6>
                <p class="mb-0 fs-6">${{ formatCurrency(rentCollected) }}</p>
                <div class="progress mt-1" style="height: 8px;">
                  <div 
                    class="progress-bar bg-success" 
                    :style="{ width: rentCollectionPercentage + '%' }"
                  ></div>
                </div>
                <small class="text-muted">{{ rentCollectionPercentage.toFixed(1) }}% collected</small>
              </div>
              
              <div class="mb-3">
                <h6 class="text-muted mb-1">Security Deposit</h6>
                <p class="mb-0">${{ formatCurrency(lease.security_deposit) }}</p>
              </div>
              
              <hr>
              
              <div class="mb-0">
                <h6 class="text-muted mb-1">Total Value</h6>
                <p class="mb-0 fs-5 fw-bold">${{ formatCurrency(totalValue) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Composer Modal -->
    <EmailComposer
      v-if="showEmailModal"
      :show="showEmailModal"
      :preselected-lease="lease"
      @close="closeEmailComposer"
      @email-sent="onEmailSent"
    />

    <!-- Delete Confirmation Modal -->
    <div 
      v-if="showDeleteModal" 
      class="modal fade show d-block" 
      tabindex="-1" 
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle text-danger me-2"></i>
              Confirm Delete
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showDeleteModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this lease?</p>
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone.
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showDeleteModal = false"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteLease"
              :disabled="deleting"
            >
              <span v-if="deleting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <i v-else class="bi bi-trash me-1"></i>
              Delete Lease
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLeaseStore } from '@/stores/leaseStore'
import { usePropertyStore } from '@/stores/propertyStore'
import { useContactStore } from '@/stores/contactStore'
import { useAppStore } from '@/stores/app'
import EmailComposer from '@/components/EmailComposer.vue'
import emailService from '@/services/emailService'

export default {
  name: 'LeaseDetail',
  components: {
    EmailComposer
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const leaseStore = useLeaseStore()
    const propertyStore = usePropertyStore()
    const contactStore = useContactStore()
    const appStore = useAppStore()

    // Reactive data
    const loading = ref(true)
    const error = ref(null)
    const showDeleteModal = ref(false)
    const deleting = ref(false)
    const showEmailModal = ref(false)

    // Computed properties
    const leaseId = computed(() => route.params.id)
    const lease = computed(() => leaseStore.currentLease)
    
    const property = computed(() => {
      if (!lease.value?.property_id) return null
      return propertyStore.properties?.find(p => p.id === lease.value.property_id)
    })
    
    const tenant = computed(() => {
      if (!lease.value?.tenant_id) return null
      return contactStore.contacts?.find(c => c.id === lease.value.tenant_id)
    })

    const landlord = computed(() => {
      if (!lease.value?.landlord_id) return null
      return contactStore.contacts?.find(c => c.id === lease.value.landlord_id)
    })

    const daysRemaining = computed(() => {
      if (!lease.value?.end_date) return 'N/A'
      
      const today = new Date()
      const endDate = new Date(lease.value.end_date)
      const diffTime = endDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'Expired'
      if (diffDays === 0) return 'Expires today'
      if (diffDays === 1) return '1 day'
      return `${diffDays} days`
    })

    const totalDuration = computed(() => {
      if (!lease.value?.start_date || !lease.value?.end_date) return 'N/A'
      
      const start = new Date(lease.value.start_date)
      const end = new Date(lease.value.end_date)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffMonths = Math.round(diffDays / 30.44)
      
      if (diffMonths >= 12) {
        const years = Math.floor(diffMonths / 12)
        const remainingMonths = diffMonths % 12
        return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
      } else {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`
      }
    })

    const progressPercentage = computed(() => {
      if (!lease.value?.start_date || !lease.value?.end_date) return 0
      
      const start = new Date(lease.value.start_date)
      const end = new Date(lease.value.end_date)
      const today = new Date()
      
      if (today < start) return 0
      if (today > end) return 100
      
      const totalDuration = end - start
      const elapsed = today - start
      
      return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
    })

    const totalRent = computed(() => {
      if (!lease.value?.start_date || !lease.value?.end_date || !lease.value?.monthly_rent) return 0
      
      const start = new Date(lease.value.start_date)
      const end = new Date(lease.value.end_date)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffMonths = Math.round(diffDays / 30.44)
      
      return lease.value.monthly_rent * diffMonths
    })

    const rentCollected = computed(() => {
      // This would come from payment records in a real system
      // For now, calculate based on progress
      return totalRent.value * (progressPercentage.value / 100)
    })

    const rentCollectionPercentage = computed(() => {
      if (totalRent.value === 0) return 0
      return (rentCollected.value / totalRent.value) * 100
    })

    const totalValue = computed(() => {
      return totalRent.value + (lease.value?.security_deposit || 0)
    })

    // Methods
    const goBack = () => {
      router.push('/leases')
    }

    const editLease = () => {
      router.push(`/leases/${leaseId.value}/edit`)
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0.00'
      return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const getStatusBadgeClass = (status) => {
      const classes = 'badge '
      switch (status) {
        case 'active': return classes + 'bg-success'
        case 'pending': return classes + 'bg-warning text-dark'
        case 'expired': return classes + 'bg-danger'
        case 'terminated': return classes + 'bg-secondary'
        default: return classes + 'bg-secondary'
      }
    }

    const getDaysRemainingClass = () => {
      const remaining = daysRemaining.value
      if (remaining === 'Expired') return 'text-danger'
      if (remaining === 'Expires today' || (typeof remaining === 'string' && remaining.includes('1 day'))) return 'text-warning'
      if (typeof remaining === 'string' && parseInt(remaining) <= 30) return 'text-warning'
      return 'text-success'
    }

    const getProgressBarClass = () => {
      const percentage = progressPercentage.value
      if (percentage >= 90) return 'bg-danger'
      if (percentage >= 75) return 'bg-warning'
      return 'bg-success'
    }

    const updateStatus = async (newStatus) => {
      try {
        await leaseStore.updateLease(leaseId.value, { status: newStatus })
        appStore.showSuccess(`Lease status updated to ${newStatus}`)
      } catch (error) {
        console.error('Failed to update lease status:', error)
        appStore.showError('Failed to update lease status')
      }
    }

    const deleteLease = async () => {
      try {
        deleting.value = true
        await leaseStore.deleteLease(leaseId.value)
        appStore.showSuccess('Lease deleted successfully')
        goBack()
      } catch (error) {
        console.error('Failed to delete lease:', error)
        appStore.showError('Failed to delete lease')
      } finally {
        deleting.value = false
        showDeleteModal.value = false
      }
    }

    const showEmailComposer = () => {
      showEmailModal.value = true
    }

    const closeEmailComposer = () => {
      showEmailModal.value = false
    }

    const onEmailSent = (result) => {
      appStore.showSuccess('Email sent successfully!')
      closeEmailComposer()
    }

    const sendLeaseReminder = async () => {
      try {
        appStore.showLoading('Sending lease reminder...')
        
        // Calculate days until expiration for reminder type
        const today = new Date()
        const endDate = new Date(lease.value.end_date)
        const diffTime = endDate - today
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        let reminderType = 'custom'
        if (daysRemaining <= 30) reminderType = '30_day'
        else if (daysRemaining <= 60) reminderType = '60_day'
        else if (daysRemaining <= 90) reminderType = '90_day'
        
        await emailService.sendLeaseReminder(leaseId.value, reminderType)
        appStore.showSuccess(`Lease reminder sent successfully! (${daysRemaining} days remaining)`)
      } catch (error) {
        console.error('Failed to send lease reminder:', error)
        appStore.showError('Failed to send lease reminder')
      } finally {
        appStore.hideLoading()
      }
    }

    const emailTenant = () => {
      showEmailModal.value = true
      // The EmailComposer will handle pre-selecting the tenant
    }

    const emailLandlord = () => {
      showEmailModal.value = true
      // The EmailComposer will handle pre-selecting the landlord
    }

    const emailAllParties = () => {
      showEmailModal.value = true
      // The EmailComposer will handle pre-selecting all parties
    }

    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        
        // Load lease data
        await leaseStore.fetchLease(leaseId.value)
        
        if (!leaseStore.currentLease) {
          throw new Error('Lease not found')
        }
        
        // Load related data
        await Promise.all([
          propertyStore.fetchProperties(),
          contactStore.fetchContacts()
        ])
        
      } catch (err) {
        console.error('Failed to load lease data:', err)
        error.value = err.message || 'Failed to load lease data'
      } finally {
        loading.value = false
      }
    }

    // Lifecycle
    onMounted(loadData)

    return {
      loading,
      error,
      lease,
      property,
      tenant,
      landlord,
      daysRemaining,
      totalDuration,
      progressPercentage,
      totalRent,
      rentCollected,
      rentCollectionPercentage,
      totalValue,
      showDeleteModal,
      deleting,
      showEmailModal,
      goBack,
      editLease,
      formatDate,
      formatCurrency,
      getStatusBadgeClass,
      getDaysRemainingClass,
      getProgressBarClass,
      updateStatus,
      deleteLease,
      showEmailComposer,
      closeEmailComposer,
      onEmailSent,
      sendLeaseReminder,
      emailTenant,
      emailLandlord,
      emailAllParties
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
.d-grid{
  max-width: 200px;
  margin:auto;
}
.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}

.progress {
  height: 0.75rem;
}

.position-sticky {
  position: sticky !important;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Modal backdrop */
.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .position-sticky {
    position: relative !important;
  }
  
  .btn-group .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
}
</style>
