<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <h1 class="h3 mb-0">Email Management</h1>
          <button
            class="btn btn-primary"
            @click="openEmailComposer"
          >
            <i class="fas fa-plus me-2"></i>
            Compose Email
          </button>
        </div>
        <p class="text-muted">Send emails to contacts, lease parties, or custom recipients</p>
        
      </div>
    </div>

    <!-- Email History -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-history me-2"></i>
                Email History
              </h5>
              <div class="d-flex gap-2">
                <!-- Filter dropdown -->
                <select 
                  v-model="filters.type" 
                  class="form-select form-select-sm"
                  @change="loadEmailHistory"
                >
                  <option value="">All Types</option>
                  <option value="custom">Custom</option>
                  <option value="contact">Contact</option>
                  <option value="lease_reminder">Lease Reminder</option>
                  <option value="system">System</option>
                </select>

                <button 
                  class="btn btn-outline-secondary btn-sm"
                  @click="refreshHistory"
                  :disabled="loading"
                >
                  <i class="fas fa-refresh" :class="{ 'fa-spin': loading }"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="emailHistory.length === 0" class="text-center py-5">
              <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">No emails found</h5>
              <p class="text-muted">
                {{ filters.type ? 'No emails found for this filter' : 'Start by composing your first email' }}
              </p>
            </div>

            <!-- Email History Table -->
            <div v-else>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Related</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="email in emailHistory" :key="email.id">
                      <td>
                        <small class="text-muted">
                          {{ formatDate(email.sent_at) }}
                        </small>
                      </td>
                      <td>
                        <span class="text-truncate d-inline-block" style="max-width: 200px;">
                          {{ email.recipient_email }}
                        </span>
                      </td>
                      <td>
                        <span class="text-truncate d-inline-block" style="max-width: 250px;">
                          {{ email.subject }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" :class="getTypeBadgeClass(email.email_type)">
                          {{ formatEmailType(email.email_type) }}
                        </span>
                      </td>
                      <td>
                        <span v-if="email.contact" class="text-muted small">
                          Contact: {{ email.contact.first_name }} {{ email.contact.last_name }}
                        </span>
                        <span v-else-if="email.lease" class="text-muted small">
                          Lease: {{ email.lease.property?.title || 'Unknown Property' }}
                        </span>
                        <span v-else class="text-muted small">-</span>
                      </td>
                      <td>
                        <button
                          class="btn btn-outline-primary btn-sm"
                          @click="viewEmail(email)"
                          title="View Email"
                        >
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <nav v-if="pagination.pages > 1" aria-label="Email history pagination">
                <ul class="pagination justify-content-center">
                  <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                    <button 
                      class="page-link" 
                      @click="changePage(pagination.page - 1)"
                      :disabled="pagination.page <= 1"
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
                  
                  <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                    <button 
                      class="page-link" 
                      @click="changePage(pagination.page + 1)"
                      :disabled="pagination.page >= pagination.pages"
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

    <!-- Email Detail Modal -->
    <div
      v-if="selectedEmail"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);"
      @click.self="closeEmailModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Email Details</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeEmailModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <strong>To:</strong> {{ selectedEmail.recipient_email }}
              </div>
              <div class="col-md-6">
                <strong>Date:</strong> {{ formatDate(selectedEmail.sent_at) }}
              </div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6">
                <strong>Type:</strong> 
                <span class="badge ms-1" :class="getTypeBadgeClass(selectedEmail.email_type)">
                  {{ formatEmailType(selectedEmail.email_type) }}
                </span>
              </div>
              <div class="col-md-6" v-if="selectedEmail.contact || selectedEmail.lease">
                <strong>Related:</strong>
                <span v-if="selectedEmail.contact">
                  Contact: {{ selectedEmail.contact.first_name }} {{ selectedEmail.contact.last_name }}
                </span>
                <span v-else-if="selectedEmail.lease">
                  Lease: {{ selectedEmail.lease.property?.title || 'Unknown Property' }}
                </span>
              </div>
            </div>
            <hr>
            <div>
              <strong>Subject:</strong> {{ selectedEmail.subject }}
            </div>
            <div class="mt-3">
              <strong>Message:</strong>
              <div class="border rounded p-3 mt-2 bg-light">
                <pre class="mb-0" style="white-space: pre-wrap; font-family: inherit;">{{ selectedEmail.message }}</pre>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEmailModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Composer Modal -->
    <EmailComposer 
      modal-id="emailComposerModal"
      @email-sent="handleEmailSent" 
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import EmailComposer from '@/components/EmailComposer.vue'
import { emailService } from '@/services/emailService'

export default {
  name: 'EmailManagement',
  components: {
    EmailComposer
  },
  setup() {
    const toast = useToast()
    
    // Reactive data
    const loading = ref(false)
    const emailHistory = ref([])
    const selectedEmail = ref(null)
    const filters = ref({
      type: '',
      page: 1,
      limit: 20
    })
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    })

    // Computed properties
    const visiblePages = computed(() => {
      const pages = []
      const current = pagination.value.page
      const total = pagination.value.pages
      const delta = 2

      const rangeStart = Math.max(2, current - delta)
      const rangeEnd = Math.min(total - 1, current + delta)

      if (total > 1) {
        pages.push(1)

        if (rangeStart > 2) {
          pages.push('...')
        }

        for (let i = rangeStart; i <= rangeEnd; i++) {
          pages.push(i)
        }

        if (rangeEnd < total - 1) {
          pages.push('...')
        }

        if (total > 1) {
          pages.push(total)
        }
      }

      return pages.filter((page, index, arr) => arr.indexOf(page) === index)
    })

    // Methods
    const loadEmailHistory = async () => {
      try {
        loading.value = true
        const params = {
          page: filters.value.page,
          limit: filters.value.limit
        }

        if (filters.value.type) {
          params.type = filters.value.type
        }

        const response = await emailService.getEmailHistory(params)
        emailHistory.value = response.data || []
        pagination.value = response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      } catch (error) {
        console.error('Error loading email history:', error)
        toast.error('Failed to load email history')
        emailHistory.value = []
      } finally {
        loading.value = false
      }
    }

    const refreshHistory = () => {
      filters.value.page = 1
      loadEmailHistory()
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        filters.value.page = page
        loadEmailHistory()
      }
    }

    const openEmailComposer = () => {
      console.log('openEmailComposer called')
      // Manually trigger the modal using Bootstrap
      const modalElement = document.getElementById('emailComposerModal')
      console.log('Modal element:', modalElement)
      if (modalElement) {
        // Try direct Bootstrap approach first
        if (window.bootstrap) {
          console.log('Using global Bootstrap')
          const modal = new window.bootstrap.Modal(modalElement)
          modal.show()
        } else {
          // Fallback to dynamic import
          import('bootstrap').then(bootstrap => {
            console.log('Bootstrap imported:', bootstrap)
            const modal = new bootstrap.Modal(modalElement)
            console.log('Modal instance created:', modal)
            modal.show()
          }).catch(error => {
            console.error('Error importing Bootstrap:', error)
            // Fallback: manually show modal
            modalElement.style.display = 'block'
            modalElement.classList.add('show')
            document.body.classList.add('modal-open')
          })
        }
      } else {
        console.error('Modal element not found')
        // Let's also check if EmailComposer is rendered
        console.log('All modals in DOM:', document.querySelectorAll('.modal'))
      }
    }

    const handleEmailSent = (result) => {
      toast.success(`Email${result.total > 1 ? 's' : ''} sent successfully!`)
      // Close the modal using Bootstrap's modal API
      const modalElement = document.getElementById('emailComposerModal')
      if (modalElement) {
        // Import bootstrap if not already available
        import('bootstrap').then(bootstrap => {
          const modal = bootstrap.Modal.getInstance(modalElement)
          if (modal) {
            modal.hide()
          }
        })
      }
      refreshHistory()
    }

    const viewEmail = (email) => {
      selectedEmail.value = email
    }

    const closeEmailModal = () => {
      selectedEmail.value = null
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString()
    }

    const formatEmailType = (type) => {
      const typeMap = {
        custom: 'Custom',
        contact: 'Contact',
        lease_reminder: 'Lease Reminder',
        system: 'System'
      }
      return typeMap[type] || type
    }

    const getTypeBadgeClass = (type) => {
      const classMap = {
        custom: 'bg-primary',
        contact: 'bg-info',
        lease_reminder: 'bg-warning',
        system: 'bg-secondary'
      }
      return classMap[type] || 'bg-secondary'
    }

    // Lifecycle
    onMounted(() => {
      loadEmailHistory()
    })

    return {
      loading,
      emailHistory,
      selectedEmail,
      filters,
      pagination,
      visiblePages,
      loadEmailHistory,
      refreshHistory,
      changePage,
      openEmailComposer,
      handleEmailSent,
      viewEmail,
      closeEmailModal,
      formatDate,
      formatEmailType,
      getTypeBadgeClass
    }
  }
}
</script>

<style scoped>
.table-responsive {
  border-radius: 0.375rem;
}

.text-truncate {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Remove the problematic modal style that's blocking clicks */
/* .modal {
  display: block;
} */

.pagination {
  margin-bottom: 0;
}

.badge {
  font-size: 0.75em;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
