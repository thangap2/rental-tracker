import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import contactService from '@/services/contactService'
import { useAppStore } from './app'

export const useContactStore = defineStore('contact', () => {
  const contacts = ref([])
  const currentContact = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    pages: 0,
    total: 0
  })
  const filters = ref({
    search: '',
    contactType: '',
    isActive: 'true'
  })

  const appStore = useAppStore()

  const activeContacts = computed(() => 
    contacts.value.filter(contact => contact.is_active)
  )

  const inactiveContacts = computed(() => 
    contacts.value.filter(contact => !contact.is_active)
  )

  const fetchContacts = async (params = {}) => {
    try {
      loading.value = true
      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...params
      }

      const response = await contactService.getContacts(queryParams)
      
      contacts.value = response.data
      pagination.value = response.pagination
      
      return response
    } catch (error) {
      appStore.showError('Failed to fetch contacts')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchContact = async (id) => {
    try {
      loading.value = true
      const response = await contactService.getContact(id)
      currentContact.value = response.data
      return response
    } catch (error) {
      appStore.showError('Failed to fetch contact details')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createContact = async (contactData) => {
    try {
      loading.value = true
      const response = await contactService.createContact(contactData)
      
      // Add to local state if we're on the first page
      if (pagination.value.page === 1) {
        contacts.value.unshift(response.data)
      }
      
      appStore.showSuccess('Contact created successfully')
      return response
    } catch (error) {
      appStore.showError('Failed to create contact')
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateContact = async (id, contactData) => {
    try {
      loading.value = true
      const response = await contactService.updateContact(id, contactData)
      
      // Update local state
      const index = contacts.value.findIndex(contact => contact.id === id)
      if (index !== -1) {
        contacts.value[index] = response.data
      }
      
      if (currentContact.value && currentContact.value.id === id) {
        currentContact.value = response.data
      }
      
      appStore.showSuccess('Contact updated successfully')
      return response
    } catch (error) {
      appStore.showError('Failed to update contact')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteContact = async (id) => {
    try {
      loading.value = true
      await contactService.deleteContact(id)
      
      // Remove from local state
      contacts.value = contacts.value.filter(contact => contact.id !== id)
      
      if (currentContact.value && currentContact.value.id === id) {
        currentContact.value = null
      }
      
      appStore.showSuccess('Contact deleted successfully')
    } catch (error) {
      appStore.showError('Failed to delete contact')
      throw error
    } finally {
      loading.value = false
    }
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // Reset to first page when filtering
  }

  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  const clearCurrentContact = () => {
    currentContact.value = null
  }

  const resetStore = () => {
    contacts.value = []
    currentContact.value = null
    loading.value = false
    pagination.value = {
      page: 1,
      limit: 10,
      pages: 0,
      total: 0
    }
    filters.value = {
      search: '',
      contactType: '',
      isActive: 'true'
    }
  }

  return {
    contacts,
    currentContact,
    loading,
    pagination,
    filters,
    activeContacts,
    inactiveContacts,
    fetchContacts,
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    setFilters,
    setPagination,
    clearCurrentContact,
    resetStore
  }
})