import api from './api'

class EmailService {
  async sendEmails(emails) {
    try {
      const response = await api.post('/emails/send', { emails })
      return response.data
    } catch (error) {
      console.error('Error sending emails:', error)
      throw error
    }
  }

  async sendToContacts(contactIds, emailData) {
    try {
      const response = await api.post('/emails/send-to-contacts', {
        contactIds,
        ...emailData
      })
      return response.data
    } catch (error) {
      console.error('Error sending emails to contacts:', error)
      throw error
    }
  }

  async sendLeaseReminder(leaseId, reminderType, customMessage = null) {
    try {
      const response = await api.post('/emails/lease-reminder', {
        leaseId,
        reminderType,
        customMessage
      })
      return response.data
    } catch (error) {
      console.error('Error sending lease reminder:', error)
      throw error
    }
  }

  async getEmailTemplates() {
    try {
      const response = await api.get('/emails/templates')
      return response.data
    } catch (error) {
      console.error('Error fetching email templates:', error)
      throw error
    }
  }

  async saveEmailTemplate(templateData) {
    try {
      const response = await api.post('/emails/templates', templateData)
      return response.data
    } catch (error) {
      console.error('Error saving email template:', error)
      throw error
    }
  }

  async getEmailHistory(params = {}) {
    try {
      const response = await api.get('/emails/history', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching email history:', error)
      throw error
    }
  }
}

const emailService = new EmailService()
export { emailService }
export default emailService
