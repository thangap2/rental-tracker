import api from './api'

class ReminderService {
  async getExpiringLeases(days = 90) {
    try {
      const response = await api.get('/reminders/expiring', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching expiring leases:', error)
      throw error
    }
  }

  async getReminderStats(days = 90) {
    try {
      const response = await api.get('/reminders/stats', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching reminder stats:', error)
      throw error
    }
  }

  async getReminderHistory(leaseId) {
    try {
      const response = await api.get(`/reminders/lease/${leaseId}/history`)
      return response.data
    } catch (error) {
      console.error('Error fetching reminder history:', error)
      throw error
    }
  }

  async sendManualReminder(leaseId, days) {
    try {
      const response = await api.post(`/reminders/lease/${leaseId}/manual`, {
        days
      })
      return response.data
    } catch (error) {
      console.error('Error sending manual reminder:', error)
      throw error
    }
  }

  async runReminderCheck() {
    try {
      const response = await api.post('/reminders/check')
      return response.data
    } catch (error) {
      console.error('Error running reminder check:', error)
      throw error
    }
  }
}

export default new ReminderService()
