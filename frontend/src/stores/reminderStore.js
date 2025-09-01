import { defineStore } from 'pinia'
import reminderService from '@/services/reminderService'

export const useReminderStore = defineStore('reminder', {
  state: () => ({
    expiringLeases: [],
    reminderStats: {},
    reminderHistory: {},
    loading: false,
    error: null
  }),

  getters: {
    leasesExpiring30Days: (state) => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      return state.expiringLeases.filter(lease => {
        const endDate = new Date(lease.end_date)
        return endDate <= thirtyDaysFromNow
      })
    },

    leasesExpiring60Days: (state) => {
      const sixtyDaysFromNow = new Date()
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      return state.expiringLeases.filter(lease => {
        const endDate = new Date(lease.end_date)
        return endDate > thirtyDaysFromNow && endDate <= sixtyDaysFromNow
      })
    },

    leasesExpiring90Days: (state) => {
      const ninetyDaysFromNow = new Date()
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
      const sixtyDaysFromNow = new Date()
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
      
      return state.expiringLeases.filter(lease => {
        const endDate = new Date(lease.end_date)
        return endDate > sixtyDaysFromNow && endDate <= ninetyDaysFromNow
      })
    },

    leasesByExpirationMonth: (state) => {
      const grouped = {}
      
      state.expiringLeases.forEach(lease => {
        const endDate = new Date(lease.end_date)
        const monthKey = endDate.toISOString().substring(0, 7) // YYYY-MM
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(lease)
      })
      
      return grouped
    }
  },

  actions: {
    async fetchExpiringLeases(days = 90) {
      this.loading = true
      this.error = null
      
      try {
        const response = await reminderService.getExpiringLeases(days)
        this.expiringLeases = response.data || []
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch expiring leases'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchReminderStats(days = 90) {
      this.loading = true
      this.error = null
      
      try {
        const response = await reminderService.getReminderStats(days)
        this.reminderStats = response.data || {}
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch reminder stats'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchReminderHistory(leaseId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await reminderService.getReminderHistory(leaseId)
        this.reminderHistory[leaseId] = response.data || []
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch reminder history'
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendManualReminder(leaseId, days) {
      this.loading = true
      this.error = null
      
      try {
        const response = await reminderService.sendManualReminder(leaseId, days)
        
        // Refresh reminder history for this lease
        await this.fetchReminderHistory(leaseId)
        
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send manual reminder'
        throw error
      } finally {
        this.loading = false
      }
    },

    async runReminderCheck() {
      this.loading = true
      this.error = null
      
      try {
        const response = await reminderService.runReminderCheck()
        
        // Refresh data after running check
        await Promise.all([
          this.fetchExpiringLeases(),
          this.fetchReminderStats()
        ])
        
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to run reminder check'
        throw error
      } finally {
        this.loading = false
      }
    },

    getDaysUntilExpiration(endDate) {
      const today = new Date()
      const end = new Date(endDate)
      const diffTime = end - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    },

    getReminderStatus(lease) {
      const daysUntil = this.getDaysUntilExpiration(lease.end_date)
      const history = this.reminderHistory[lease.id] || []
      
      const sentReminders = {
        90: history.some(h => h.reminder_days === 90),
        60: history.some(h => h.reminder_days === 60),
        30: history.some(h => h.reminder_days === 30)
      }
      
      if (daysUntil <= 30) {
        return {
          status: 'urgent',
          next_reminder: sentReminders[30] ? null : 30,
          sent_reminders: sentReminders
        }
      } else if (daysUntil <= 60) {
        return {
          status: 'warning',
          next_reminder: sentReminders[60] ? (sentReminders[30] ? null : 30) : 60,
          sent_reminders: sentReminders
        }
      } else if (daysUntil <= 90) {
        return {
          status: 'info',
          next_reminder: sentReminders[90] ? (sentReminders[60] ? (sentReminders[30] ? null : 30) : 60) : 90,
          sent_reminders: sentReminders
        }
      }
      
      return {
        status: 'future',
        next_reminder: null,
        sent_reminders: sentReminders
      }
    },

    clearError() {
      this.error = null
    }
  }
})
