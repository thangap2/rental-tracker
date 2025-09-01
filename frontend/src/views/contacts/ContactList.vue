<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h3 mb-0">
            <i class="bi bi-people me-2"></i>
            Contacts
            <span class="badge bg-secondary ms-2">{{ pagination.total }}</span>
          </h1>
          <router-link to="/contacts/new" class="btn btn-primary">
            <i class="bi bi-person-plus me-2"></i>
            Add Contact
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
                  placeholder="Search by name or email..."
                  @input="debouncedSearch"
                >
              </div>
              <div class="col-md-3">
                <label class="form-label">Contact Type</label>
                <select v-model="selectedContactType" class="form-select" @change="applyFilters">
                  <option value="">All Types</option>
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="both">Both</option>
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

        <!-- Contacts Table -->
        <div class="card">
          <div class="card-body">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2 text-muted">Loading contacts...</p>
            </div>

            <div v-else-if="contacts.length === 0" class="text-center py-5">
              <i class="bi bi-people display-1 text-muted"></i>
              <h4 class="mt-3">No Contacts Found</h4>
              <p class="text-muted">
                {{ hasFilters ? 'No contacts match your current filters.' : 'You haven\'t added any contacts yet.' }}
              </p>
              <router-link to="/contacts/new" class="btn btn-primary">
                <i class="bi bi-person-plus me-2"></i>
                Add Your First Contact
              </router-link>
            </div>

            <div v-else>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="contact in contacts" :key="contact.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="avatar-circle me-2">
                            {{ getInitials(contact.first_name, contact.last_name) }}
                          </div>
                          <div>
                            <div class="fw-medium">{{ contact.first_name }} {{ contact.last_name }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a :href="`mailto:${contact.email}`" class="text-decoration-none">
                          {{ contact.email }}
                        </a>
                      </td>
                      <td>
                        <a :href="`tel:${contact.phone}`" class="text-decoration-none">
                          {{ formatPhone(contact.phone) }}
                        </a>
                      </td>
                      <td>
                        <span class="badge" :class="getContactTypeBadge(contact.contact_type)">
                          {{ formatContactType(contact.contact_type) }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" :class="contact.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ contact.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>{{ formatDate(contact.created_at) }}</td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <router-link
                            :to="`/contacts/${contact.id}`"
                            class="btn btn-outline-primary"
                            title="View Details"
                          >
                            <i class="bi bi-eye"></i>
                          </router-link>
                          <router-link
                            :to="`/contacts/${contact.id}/edit`"
                            class="btn btn-outline-secondary"
                            title="Edit Contact"
                          >
                            <i class="bi bi-pencil"></i>
                          </router-link>
                          <button
                            @click="confirmDelete(contact)"
                            class="btn btn-outline-danger"
                            title="Delete Contact"
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
            <p>Are you sure you want to delete <strong>{{ contactToDelete?.first_name }} {{ contactToDelete?.last_name }}</strong>?</p>
            <p class="text-muted small">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteContact"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Delete Contact
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
import { useContactStore } from '@/stores/contactStore'
import { format } from 'date-fns'

export default {
  name: 'ContactList',
  setup() {
    const contactStore = useContactStore()
    const searchQuery = ref('')
    const selectedContactType = ref('')
    const selectedStatus = ref('true')
    const contactToDelete = ref(null)
    const searchTimeout = ref(null)

    const { contacts, loading, pagination, filters } = storeToRefs(contactStore)

    const hasFilters = computed(() => {
      return filters.search || filters.contactType || filters.isActive !== 'true'
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
      contactStore.setFilters({
        search: searchQuery.value,
        contactType: selectedContactType.value,
        isActive: selectedStatus.value
      })
      contactStore.fetchContacts()
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedContactType.value = ''
      selectedStatus.value = 'true'
      applyFilters()
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.pages) {
        contactStore.setPagination({ page })
        contactStore.fetchContacts()
      }
    }

    const confirmDelete = (contact) => {
      contactToDelete.value = contact
      const modal = new bootstrap.Modal(document.getElementById('deleteModal'))
      modal.show()
    }

    const deleteContact = async () => {
      if (contactToDelete.value) {
        try {
          await contactStore.deleteContact(contactToDelete.value.id)
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'))
          modal.hide()
          contactToDelete.value = null
          
          // Refresh the list
          await contactStore.fetchContacts()
        } catch (error) {
          console.error('Error deleting contact:', error)
        }
      }
    }

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

    const formatDate = (date) => {
      if (!date) return ''
      return format(new Date(date), 'MMM dd, yyyy')
    }

    onMounted(() => {
      contactStore.fetchContacts()
    })

    return {
      contacts,
      loading,
      pagination,
      filters,
      searchQuery,
      selectedContactType,
      selectedStatus,
      contactToDelete,
      hasFilters,
      visiblePages,
      debouncedSearch,
      applyFilters,
      clearFilters,
      changePage,
      confirmDelete,
      deleteContact,
      getInitials,
      formatPhone,
      formatContactType,
      getContactTypeBadge,
      formatDate
    }
  }
}
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}



.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}
</style>
