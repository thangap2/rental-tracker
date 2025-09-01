import api from './api'

class LeaseService {
  async getLeases(params = {}) {
    const response = await api.get('/leases', { params })
    return response.data
  }

  async getLease(id) {
    const response = await api.get(`/leases/${id}`)
    return response.data
  }

  async createLease(leaseData) {
    const response = await api.post('/leases', leaseData)
    return response.data
  }

  async updateLease(id, leaseData) {
    const response = await api.put(`/leases/${id}`, leaseData)
    return response.data
  }

  async deleteLease(id) {
    const response = await api.delete(`/leases/${id}`)
    return response.data
  }

  async getLeasesByProperty(propertyId) {
    const response = await api.get('/leases', { 
      params: { propertyId } 
    })
    return response.data
  }

  async getLeasesByTenant(tenantId) {
    const response = await api.get('/leases', { 
      params: { tenantId } 
    })
    return response.data
  }
}

export default new LeaseService()
