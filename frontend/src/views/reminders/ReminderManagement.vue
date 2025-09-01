<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-bell me-2"></i>
            Lease Expiration Reminders
          </h1>
          <div class="btn-group">
            <button 
              @click="runReminderCheck" 
              class="btn btn-primary"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-arrow-clockwise me-2"></i>
              Run Check Now
            </button>
            <button @click="refreshData" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-repeat me-2"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-danger">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ leasesExpiring30Days.length }}</h5>
                    <p class="card-text text-muted small">Expiring in 30 Days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-warning">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-clock-fill text-warning" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ leasesExpiring60Days.length }}</h5>
                    <p class="card-text text-muted small">Expiring in 60 Days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-info">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-info-circle-fill text-info" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ leasesExpiring90Days.length }}</h5>
                    <p class="card-text text-muted small">Expiring in 90 Days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-primary">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <i class="bi bi-calendar-event-fill text-primary" style="font-size: 2rem;"></i>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">{{ expiringLeases.length }}</h5>
                    <p class="card-text text-muted small">Total Expiring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Options -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label for="daysFilter" class="form-label">Show leases expiring within</label>
                <select
                  id="daysFilter"
                  v-model="selectedDays"
                  class="form-select"
                  @change="onDaysFilterChange"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="statusFilter" class="form-label">Reminder Status</label>
                <select
                  id="statusFilter"
                  v-model="statusFilter"
                  class="form-select"
                >
                  <option value="">All Statuses</option>
                  <option value="urgent">Urgent (≤30 days)</option>
                  <option value="warning">Warning (31-60 days)</option>
                  <option value="info">Info (61-90 days)</option>
                  <option value="future">Future (>90 days)</option>
                </select>
              </div>
              <div class="col-md-4">
                <label for="reminderFilter" class="form-label">Reminder Sent</label>
                <select
                  id="reminderFilter"
                  v-model="reminderFilter"
                  class="form-select"
                >
                  <option value="">All</option>
                  <option value="sent">Reminders Sent</option>
                  <option value="pending">Pending Reminders</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading lease reminders...</p>
        </div>

        <!-- No Leases -->
        <div v-else-if="filteredLeases.length === 0" class="text-center py-5">
          <i class="bi bi-bell-slash display-1 text-muted"></i>
          <h4 class="mt-3">No Expiring Leases</h4>
          <p class="text-muted">
            No leases are expiring within the selected timeframe.
          </p>
        </div>

        <!-- Leases Table -->
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Property</th>
                  <th>Landlord</th>
                  <th>Tenant</th>
                  <th>End Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th>Reminders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lease in filteredLeases" :key="lease.id">
                  <td>
                    <div>
                      <div class="fw-medium">{{ lease.property?.title || 'Unknown Property' }}</div>
                      <small class="text-muted">{{ formatAddress(lease.property) }}</small>
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
                    <div>
                      <div class="fw-medium">
                        {{ lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant' }}
                      </div>
                      <small class="text-muted">{{ lease.tenant?.email }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="fw-medium">{{ formatDate(lease.end_date) }}</span>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      :class="getDaysLeftBadgeClass(getDaysUntilExpiration(lease.end_date))"
                    >
                      {{ getDaysUntilExpiration(lease.end_date) }} days
                    </span>
                  </td>
                  <td>
                    <span 
                      class="badge"
                      :class="getStatusBadgeClass(getReminderStatus(lease).status)"
                    >
                      {{ formatStatus(getReminderStatus(lease).status) }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <span 
                        v-for="days in [90, 60, 30]"
                        :key="days"
                        class="badge"
                        :class="getReminderBadgeClass(lease, days)"
                      >
                        {{ days }}d
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="btn-group" role="group">
                      <button
                        @click="viewReminderHistory(lease)"
                        class="btn btn-outline-info btn-sm"
                        title="View Reminder History"
                      >
                        <i class="bi bi-clock-history"></i>
                      </button>
                      <div class="btn-group" role="group">
                        <button
                          class="btn btn-outline-secondary btn-sm dropdown-toggle"
                          data-bs-toggle="dropdown"
                          title="Send Manual Reminder"
                        >
                          <i class="bi bi-envelope"></i>
                        </button>
                        <ul class="dropdown-menu">
                          <li>
                            <button 
                              @click="sendManualReminder(lease, 90)"
                              class="dropdown-item"
                              :disabled="loading"
                            >
                              90 Day Notice
                            </button>
                          </li>
                          <li>
                            <button 
                              @click="sendManualReminder(lease, 60)"
                              class="dropdown-item"
                              :disabled="loading"
                            >
                              60 Day Notice
                            </button>
                          </li>
                          <li>
                            <button 
                              @click="sendManualReminder(lease, 30)"
                              class="dropdown-item"
                              :disabled="loading"
                            >
                              30 Day Notice
                            </button>
                          </li>
                        </ul>
                      </div>
                      <router-link
                        :to="`/leases/${lease.id}`"
                        class="btn btn-outline-primary btn-sm"
                        title="View Lease Details"
                      >
                        <i class="bi bi-eye"></i>
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>        
      </div>
    </div>

    <!-- Reminder History Modal -->
    <div
      class="modal fade"
      id="reminderHistoryModal"
      tabindex="-1"
      aria-labelledby="reminderHistoryModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reminderHistoryModalLabel">
              Reminder History
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedLease" class="mb-3">
              <h6>{{ selectedLease.property?.title || 'Unknown Property' }}</h6>
              <p class="text-muted mb-0">
                Landlord: {{ selectedLease.landlord ? `${selectedLease.landlord.first_name} ${selectedLease.landlord.last_name}` : 'Unknown' }}
              </p>
              <p class="text-muted">
                Lease expires: {{ formatDate(selectedLease.end_date) }}
              </p>
            </div>
            
            <div v-if="selectedLeaseHistory.length === 0" class="text-center py-3">
              <i class="bi bi-envelope-slash text-muted" style="font-size: 2rem;"></i>
              <p class="text-muted mt-2">No reminders sent yet</p>
            </div>
            
            <div v-else class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Notice Period</th>
                    <th>Sent Date</th>
                    <th>Days Before Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reminder in selectedLeaseHistory" :key="reminder.id">
                    <td>
                      <span class="badge bg-primary">{{ reminder.reminder_days }} days</span>
                    </td>
                    <td>{{ formatDateTime(reminder.sent_at) }}</td>
                    <td>{{ calculateDaysBeforeExpiration(reminder.sent_at, selectedLease.end_date) }} days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Close
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
import { useReminderStore } from '@/stores/reminderStore'
import { format } from 'date-fns'
import { Modal } from 'bootstrap'

export default {
  name: 'ReminderManagement',
  setup() {
    const reminderStore = useReminderStore()
    
    const { 
      expiringLeases, 
      reminderStats, 
      reminderHistory,
      loading, 
      error,
      leasesExpiring30Days,
      leasesExpiring60Days,
      leasesExpiring90Days
    } = storeToRefs(reminderStore)

    const selectedDays = ref(90)
    const statusFilter = ref('')
    const reminderFilter = ref('')
    const selectedLease = ref(null)
    const reminderHistoryModal = ref(null)

    const filteredLeases = computed(() => {
      let filtered = expiringLeases.value

      // Filter by status
      if (statusFilter.value) {
        filtered = filtered.filter(lease => {
          const status = reminderStore.getReminderStatus(lease)
          return status.status === statusFilter.value
        })
      }

      // Filter by reminder sent status
      if (reminderFilter.value) {
        filtered = filtered.filter(lease => {
          const status = reminderStore.getReminderStatus(lease)
          const hasSentReminders = Object.values(status.sent_reminders).some(sent => sent)
          
          return reminderFilter.value === 'sent' ? hasSentReminders : !hasSentReminders
        })
      }

      return filtered
    })

    const selectedLeaseHistory = computed(() => {
      if (!selectedLease.value) return []
      return reminderHistory.value[selectedLease.value.id] || []
    })

    const formatDate = (date) => {
      if (!date) return 'N/A'
      return format(new Date(date), 'MMM dd, yyyy')
    }

    const formatDateTime = (date) => {
      if (!date) return 'N/A'
      return format(new Date(date), 'MMM dd, yyyy HH:mm')
    }

    const formatAddress = (property) => {
      if (!property) return 'Unknown Address'
      const parts = []
      if (property.street) parts.push(property.street)
      if (property.city) parts.push(property.city)
      if (property.state) parts.push(property.state)
      return parts.join(', ') || 'Unknown Address'
    }

    const getDaysUntilExpiration = (endDate) => {
      return reminderStore.getDaysUntilExpiration(endDate)
    }

    const getReminderStatus = (lease) => {
      return reminderStore.getReminderStatus(lease)
    }

    const getDaysLeftBadgeClass = (days) => {
      if (days <= 30) return 'bg-danger'
      if (days <= 60) return 'bg-warning text-dark'
      if (days <= 90) return 'bg-info'
      return 'bg-secondary'
    }

    const getStatusBadgeClass = (status) => {
      const classMap = {
        urgent: 'bg-danger',
        warning: 'bg-warning text-dark',
        info: 'bg-info',
        future: 'bg-secondary'
      }
      return classMap[status] || 'bg-secondary'
    }

    const formatStatus = (status) => {
      const statusMap = {
        urgent: 'Urgent',
        warning: 'Warning',
        info: 'Info',
        future: 'Future'
      }
      return statusMap[status] || status
    }

    const getReminderBadgeClass = (lease, days) => {
      const status = reminderStore.getReminderStatus(lease)
      return status.sent_reminders[days] ? 'bg-success' : 'bg-light text-dark'
    }

    const calculateDaysBeforeExpiration = (sentDate, endDate) => {
      const sent = new Date(sentDate)
      const end = new Date(endDate)
      const diffTime = end - sent
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const refreshData = async () => {
      await Promise.all([
        reminderStore.fetchExpiringLeases(selectedDays.value),
        reminderStore.fetchReminderStats(selectedDays.value)
      ])
    }

    const onDaysFilterChange = async () => {
      await refreshData()
    }

    const runReminderCheck = async () => {
      try {
        await reminderStore.runReminderCheck()
        // Show success message or handle result
      } catch (error) {
        console.error('Error running reminder check:', error)
      }
    }

    const sendManualReminder = async (lease, days) => {
      try {
        await reminderStore.sendManualReminder(lease.id, days)
        // Show success message
      } catch (error) {
        console.error('Error sending manual reminder:', error)
      }
    }

    const viewReminderHistory = async (lease) => {
      selectedLease.value = lease
      await reminderStore.fetchReminderHistory(lease.id)
      
      if (!reminderHistoryModal.value) {
        reminderHistoryModal.value = new Modal(document.getElementById('reminderHistoryModal'))
      }
      reminderHistoryModal.value.show()
    }

    onMounted(() => {
      refreshData()
    })

    return {
      expiringLeases,
      reminderStats,
      loading,
      error,
      leasesExpiring30Days,
      leasesExpiring60Days,
      leasesExpiring90Days,
      selectedDays,
      statusFilter,
      reminderFilter,
      filteredLeases,
      selectedLease,
      selectedLeaseHistory,
      formatDate,
      formatDateTime,
      formatAddress,
      getDaysUntilExpiration,
      getReminderStatus,
      getDaysLeftBadgeClass,
      getStatusBadgeClass,
      formatStatus,
      getReminderBadgeClass,
      calculateDaysBeforeExpiration,
      refreshData,
      onDaysFilterChange,
      runReminderCheck,
      sendManualReminder,
      viewReminderHistory
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

.badge {
  font-size: 0.75rem;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.table th {
  border-top: none;
  font-weight: 600;
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
}
</style>
