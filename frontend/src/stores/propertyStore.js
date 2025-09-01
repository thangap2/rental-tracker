import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import propertyService from '@/services/propertyService'
import { useAppStore } from './app'

export const usePropertyStore = defineStore('property', () => {
  const properties = ref([])
  const currentProperty = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    pages: 0,
    total: 0
  })
  const filters = ref({
    search: '',
    propertyType: '',
    city: '',
    isActive: 'true'
  })

  const appStore = useAppStore()

  const activeProperties = computed(() => 
    properties.value.filter(property => property.is_active)
  )

  const inactiveProperties = computed(() => 
    properties.value.filter(property => !property.is_active)
  )

  const propertiesByType = computed(() => {
    const grouped = {}
    properties.value.forEach(property => {
      const type = property.property_type || 'other'
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(property)
    })
    return grouped
  })

  const fetchProperties = async (params = {}) => {
    try {
      loading.value = true
      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...params
      }

      const response = await propertyService.getProperties(queryParams)
      
      properties.value = response.data
      pagination.value = response.pagination
      
      return response
    } catch (error) {
      appStore.showError('Failed to fetch properties')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchProperty = async (id) => {
    try {
      loading.value = true
      const response = await propertyService.getProperty(id)
      currentProperty.value = response.data
      return response
    } catch (error) {
      appStore.showError('Failed to fetch property details')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createProperty = async (propertyData) => {
    try {
      loading.value = true
      console.log('Creating property with data:', propertyData)
      const response = await propertyService.createProperty(propertyData)
      
      // Add to local state if we're on the first page
      if (pagination.value.page === 1) {
        properties.value.unshift(response.data)
      }
      
      appStore.showSuccess('Property created successfully')
      return response
    } catch (error) {
      console.error('Property creation error:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Failed to create property'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ')
      }
      
      appStore.showError(errorMessage)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateProperty = async (id, propertyData) => {
    try {
      loading.value = true
      const response = await propertyService.updateProperty(id, propertyData)
      
      // Update local state
      const index = properties.value.findIndex(property => property.id === id)
      if (index !== -1) {
        properties.value[index] = response.data
      }
      
      if (currentProperty.value && currentProperty.value.id === id) {
        currentProperty.value = response.data
      }
      
      appStore.showSuccess('Property updated successfully')
      return response
    } catch (error) {
      appStore.showError('Failed to update property')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteProperty = async (id) => {
    try {
      loading.value = true
      await propertyService.deleteProperty(id)
      
      // Remove from local state
      properties.value = properties.value.filter(property => property.id !== id)
      
      if (currentProperty.value && currentProperty.value.id === id) {
        currentProperty.value = null
      }
      
      appStore.showSuccess('Property deleted successfully')
    } catch (error) {
      appStore.showError('Failed to delete property')
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

  const clearCurrentProperty = () => {
    currentProperty.value = null
  }

  const resetStore = () => {
    properties.value = []
    currentProperty.value = null
    loading.value = false
    pagination.value = {
      page: 1,
      limit: 10,
      pages: 0,
      total: 0
    }
    filters.value = {
      search: '',
      propertyType: '',
      city: '',
      isActive: 'true'
    }
  }

  return {
    properties,
    currentProperty,
    loading,
    pagination,
    filters,
    activeProperties,
    inactiveProperties,
    propertiesByType,
    fetchProperties,
    fetchProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    setFilters,
    setPagination,
    clearCurrentProperty,
    resetStore
  }
})