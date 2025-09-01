import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import leaseService from '@/services/leaseService'
import { useAppStore } from './app'

export const useLeaseStore = defineStore('lease', () => {
  const leases = ref([])
  const currentLease = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    pages: 0,
    total: 0
  })
  const filters = ref({
    search: '',
    status: '',
    propertyId: '',
    tenantId: ''
  })

  const appStore = useAppStore()

  const activeLeases = computed(() => {
    const active = leases.value.filter(lease => lease.status === 'active')
    console.log('Computing activeLeases:', active.length, 'from total:', leases.value.length)
    return active
  })

  const expiredLeases = computed(() => {
    const expired = leases.value.filter(lease => lease.status === 'expired')
    console.log('Computing expiredLeases:', expired.length, 'from total:', leases.value.length)
    return expired
  })

  const pendingLeases = computed(() => 
    leases.value.filter(lease => lease.status === 'pending')
  )

  const terminatedLeases = computed(() => 
    leases.value.filter(lease => lease.status === 'terminated')
  )

  const expiringLeases = computed(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
    
    return leases.value.filter(lease => {
      if (lease.status !== 'active' || !lease.end_date) return false
      const endDate = new Date(lease.end_date)
      return endDate >= now && endDate <= thirtyDaysFromNow
    })
  })

  const monthlyRevenue = computed(() => {
    return activeLeases.value.reduce((total, lease) => {
      return total + (parseFloat(lease.monthly_rent) || 0)
    }, 0)
  })

  const averageRent = computed(() => {
    const active = activeLeases.value
    if (active.length === 0) return 0
    return monthlyRevenue.value / active.length
  })

  const leasesByStatus = computed(() => {
    const grouped = {}
    leases.value.forEach(lease => {
      const status = lease.status || 'unknown'
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status].push(lease)
    })
    return grouped
  })

  const fetchLeases = async (params = {}) => {
    try {
      loading.value = true
      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...params
      }

      const response = await leaseService.getLeases(queryParams)
      
      console.log('Lease API Response:', response)
      console.log('Response data:', response.data)
      console.log('Response pagination:', response.pagination)
      
      leases.value = response.data || []
      pagination.value = response.pagination || {}
      
      return response
    } catch (error) {
      appStore.showError('Failed to fetch leases')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchLease = async (id) => {
    try {
      loading.value = true
      const response = await leaseService.getLease(id)
      currentLease.value = response.data
      return response
    } catch (error) {
      appStore.showError('Failed to fetch lease details')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createLease = async (leaseData) => {
    try {
      loading.value = true
      console.log('Creating lease with data:', leaseData)
      const response = await leaseService.createLease(leaseData)
      
      // Add to local state if we're on the first page
      if (pagination.value.page === 1) {
        leases.value.unshift(response.data)
      }
      
      appStore.showSuccess('Lease created successfully')
      return response
    } catch (error) {
      console.error('Lease creation error:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = 'Failed to create lease'
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

  const updateLease = async (id, leaseData) => {
    try {
      loading.value = true
      const response = await leaseService.updateLease(id, leaseData)
      
      // Update local state
      const index = leases.value.findIndex(lease => lease.id === id)
      if (index !== -1) {
        leases.value[index] = response.data
      }
      
      if (currentLease.value && currentLease.value.id === id) {
        currentLease.value = response.data
      }
      
      appStore.showSuccess('Lease updated successfully')
      return response
    } catch (error) {
      console.error('Lease update error:', error)
      let errorMessage = 'Failed to update lease'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      appStore.showError(errorMessage)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteLease = async (id) => {
    try {
      loading.value = true
      await leaseService.deleteLease(id)
      
      // Remove from local state
      leases.value = leases.value.filter(lease => lease.id !== id)
      
      if (currentLease.value && currentLease.value.id === id) {
        currentLease.value = null
      }
      
      appStore.showSuccess('Lease deleted successfully')
    } catch (error) {
      appStore.showError('Failed to delete lease')
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

  const clearCurrentLease = () => {
    currentLease.value = null
  }

  const resetStore = () => {
    leases.value = []
    currentLease.value = null
    loading.value = false
    pagination.value = {
      page: 1,
      limit: 10,
      pages: 0,
      total: 0
    }
    filters.value = {
      search: '',
      status: '',
      propertyId: '',
      tenantId: ''
    }
  }

  return {
    leases,
    currentLease,
    loading,
    pagination,
    filters,
    activeLeases,
    expiredLeases,
    pendingLeases,
    terminatedLeases,
    expiringLeases,
    monthlyRevenue,
    averageRent,
    leasesByStatus,
    fetchLeases,
    fetchLease,
    createLease,
    updateLease,
    deleteLease,
    setFilters,
    setPagination,
    clearCurrentLease,
    resetStore
  }
})
