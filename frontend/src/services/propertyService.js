import api from './api'

class PropertyService {
  async getProperties(params = {}) {
    const response = await api.get('/properties', { params })
    return response.data
  }

  async getProperty(id) {
    const response = await api.get(`/properties/${id}`)
    return response.data
  }

  async createProperty(propertyData) {
    const response = await api.post('/properties', propertyData)
    return response.data
  }

  async updateProperty(id, propertyData) {
    const response = await api.put(`/properties/${id}`, propertyData)
    return response.data
  }

  async deleteProperty(id) {
    const response = await api.delete(`/properties/${id}`)
    return response.data
  }
}

export default new PropertyService()