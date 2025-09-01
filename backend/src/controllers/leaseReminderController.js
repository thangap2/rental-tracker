const leaseReminderService = require('../services/leaseReminderService');

class LeaseReminderController {
  // Run the automatic reminder check (typically called by a cron job)
  async runReminderCheck(req, res) {
    try {
      const results = await leaseReminderService.checkAndSendReminders();
      
      res.json({
        success: true,
        message: 'Reminder check completed',
        results: results,
        summary: {
          total_processed: results.length,
          reminders_sent: results.filter(r => r.status === 'sent').length,
          already_sent: results.filter(r => r.status === 'already_sent').length,
          errors: results.filter(r => r.status === 'error').length
        }
      });
    } catch (error) {
      console.error('Error in runReminderCheck:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run reminder check',
        error: error.message
      });
    }
  }

  // Get leases expiring in the next X days
  async getExpiringLeases(req, res) {
    try {
      const { days = 90 } = req.query;
      const realtorId = req.user.id;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(days));
      
      const leases = await leaseReminderService.getLeasesExpiringInRange(startDate, endDate);
      
      // Filter by realtor_id if not admin
      const filteredLeases = leases.filter(lease => 
        lease.realtor && lease.realtor.id === realtorId
      );
      
      res.json({
        success: true,
        data: filteredLeases,
        meta: {
          total: filteredLeases.length,
          days_ahead: parseInt(days),
          date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          }
        }
      });
    } catch (error) {
      console.error('Error in getExpiringLeases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get expiring leases',
        error: error.message
      });
    }
  }

  // Get reminder history for a specific lease
  async getReminderHistory(req, res) {
    try {
      const { leaseId } = req.params;
      const history = await leaseReminderService.getReminderHistory(leaseId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getReminderHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reminder history',
        error: error.message
      });
    }
  }

  // Manually trigger a reminder for a specific lease
  async manualReminder(req, res) {
    try {
      const { leaseId } = req.params;
      const { days } = req.body;
      
      if (!days || ![90, 60, 30].includes(parseInt(days))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reminder days. Must be 90, 60, or 30.'
        });
      }
      
      const result = await leaseReminderService.manuallyTriggerReminder(leaseId, parseInt(days));
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in manualReminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send manual reminder',
        error: error.message
      });
    }
  }

  // Get reminder statistics
  async getReminderStats(req, res) {
    try {
      const { days = 90 } = req.query;
      const realtorId = req.user.id;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(days));
      
      const expiringLeases = await leaseReminderService.getLeasesExpiringInRange(startDate, endDate);
      
      // Filter by realtor if not admin
      const filteredLeases = expiringLeases.filter(lease => 
        lease.realtor && lease.realtor.id === realtorId
      );
      
      // Group by reminder periods
      const stats = {
        total_expiring: filteredLeases.length,
        expiring_30_days: 0,
        expiring_60_days: 0,
        expiring_90_days: 0,
        by_month: {}
      };
      
      const today = new Date();
      
      filteredLeases.forEach(lease => {
        const endDate = new Date(lease.end_date);
        const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        const monthKey = endDate.toISOString().substring(0, 7); // YYYY-MM format
        
        if (daysUntilExpiration <= 30) {
          stats.expiring_30_days++;
        } else if (daysUntilExpiration <= 60) {
          stats.expiring_60_days++;
        } else if (daysUntilExpiration <= 90) {
          stats.expiring_90_days++;
        }
        
        if (!stats.by_month[monthKey]) {
          stats.by_month[monthKey] = 0;
        }
        stats.by_month[monthKey]++;
      });
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getReminderStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reminder statistics',
        error: error.message
      });
    }
  }
}

module.exports = new LeaseReminderController();
