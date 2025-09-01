import api from './api'

class ContactService {
  async getContacts(params = {}) {
    const response = await api.get('/contacts', { params })
    return response.data
  }

  async getContact(id) {
    const response = await api.get(`/contacts/${id}`)
    return response.data
  }

  async createContact(contactData) {
    const response = await api.post('/contacts', contactData)
    return response.data
  }

  async updateContact(id, contactData) {
    const response = await api.put(`/contacts/${id}`, contactData)
    return response.data
  }

  async deleteContact(id) {
    const response = await api.delete(`/contacts/${id}`)
    return response.data
  }
}

export default new ContactService()