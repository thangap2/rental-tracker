const { supabase } = require('../config/database');
const emailService = require('./emailService');

class LeaseReminderService {
  constructor() {
    this.reminderDays = [90, 60, 30]; // Days before lease expiration to send reminders
  }

  async checkAndSendReminders() {
    console.log('Starting lease expiration reminder check...');
    
    try {
      const today = new Date();
      const remindersProcessed = [];

      for (const days of this.reminderDays) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + days);
        
        const leasesExpiring = await this.getLeasesExpiringOn(targetDate);
        
        for (const lease of leasesExpiring) {
          try {
            // Check if reminder already sent for this lease and days combination
            const reminderAlreadySent = await this.checkReminderSent(lease.id, days);
            
            if (!reminderAlreadySent) {
              await this.sendReminderForLease(lease, days);
              await this.recordReminderSent(lease.id, days);
              remindersProcessed.push({
                leaseId: lease.id,
                days: days,
                property: lease.property?.title || 'Unknown',
                landlord: `${lease.landlord?.first_name} ${lease.landlord?.last_name}`,
                status: 'sent'
              });
            } else {
              remindersProcessed.push({
                leaseId: lease.id,
                days: days,
                property: lease.property?.title || 'Unknown',
                landlord: `${lease.landlord?.first_name} ${lease.landlord?.last_name}`,
                status: 'already_sent'
              });
            }
          } catch (error) {
            console.error(`Error processing reminder for lease ${lease.id}:`, error);
            remindersProcessed.push({
              leaseId: lease.id,
              days: days,
              property: lease.property?.title || 'Unknown',
              landlord: `${lease.landlord?.first_name} ${lease.landlord?.last_name}`,
              status: 'error',
              error: error.message
            });
          }
        }
      }

      console.log('Lease reminder check completed:', remindersProcessed);
      return remindersProcessed;
    } catch (error) {
      console.error('Error in checkAndSendReminders:', error);
      throw error;
    }
  }

  async getLeasesExpiringOn(targetDate) {
    try {
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const { data: leases, error } = await supabase
        .from('leases')
        .select(`
          id,
          end_date,
          monthly_rent,
          security_deposit,
          lease_type,
          status,
          property:property_id (
            id,
            title,
            street,
            city,
            state,
            zip_code
          ),
          tenant:tenant_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          landlord:landlord_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          realtor:realtor_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            brokerage
          )
        `)
        .eq('end_date', targetDateStr)
        .in('status', ['active', 'pending']);

      if (error) {
        throw error;
      }

      return leases || [];
    } catch (error) {
      console.error('Error fetching leases expiring on', targetDate, ':', error);
      throw error;
    }
  }

  async sendReminderForLease(lease, daysUntilExpiration) {
    if (!lease.landlord || !lease.realtor) {
      throw new Error(`Missing landlord or realtor information for lease ${lease.id}`);
    }

    if (!lease.landlord.email || !lease.realtor.email) {
      throw new Error(`Missing email addresses for lease ${lease.id}`);
    }

    await emailService.sendLeaseExpirationReminder(
      lease.landlord,
      lease.realtor,
      lease,
      daysUntilExpiration
    );
  }

  async checkReminderSent(leaseId, days) {
    try {
      const { data, error } = await supabase
        .from('lease_reminders')
        .select('id')
        .eq('lease_id', leaseId)
        .eq('reminder_days', days)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking reminder sent status:', error);
      return false; // If there's an error, assume reminder wasn't sent and try to send
    }
  }

  async recordReminderSent(leaseId, days) {
    try {
      const { error } = await supabase
        .from('lease_reminders')
        .insert({
          lease_id: leaseId,
          reminder_days: days,
          sent_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error recording reminder sent:', error);
      throw error;
    }
  }

  async getLeasesExpiringInRange(startDate, endDate) {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const { data: leases, error } = await supabase
        .from('leases')
        .select(`
          id,
          end_date,
          monthly_rent,
          lease_type,
          status,
          property:property_id (
            id,
            title,
            street,
            city,
            state
          ),
          tenant:tenant_id (
            id,
            first_name,
            last_name,
            email
          ),
          landlord:landlord_id (
            id,
            first_name,
            last_name,
            email
          ),
          realtor:realtor_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .gte('end_date', startDateStr)
        .lte('end_date', endDateStr)
        .in('status', ['active', 'pending'])
        .order('end_date', { ascending: true });

      if (error) {
        throw error;
      }

      return leases || [];
    } catch (error) {
      console.error('Error fetching leases expiring in range:', error);
      throw error;
    }
  }

  async getReminderHistory(leaseId) {
    try {
      const { data, error } = await supabase
        .from('lease_reminders')
        .select('*')
        .eq('lease_id', leaseId)
        .order('sent_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching reminder history:', error);
      throw error;
    }
  }

  async manuallyTriggerReminder(leaseId, days) {
    try {
      // Get the lease with all related data
      const { data: lease, error } = await supabase
        .from('leases')
        .select(`
          id,
          end_date,
          monthly_rent,
          security_deposit,
          lease_type,
          status,
          property:property_id (
            id,
            title,
            street,
            city,
            state,
            zip_code
          ),
          tenant:tenant_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          landlord:landlord_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          realtor:realtor_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            brokerage
          )
        `)
        .eq('id', leaseId)
        .single();

      if (error) {
        throw error;
      }

      if (!lease) {
        throw new Error(`Lease ${leaseId} not found`);
      }

      await this.sendReminderForLease(lease, days);
      await this.recordReminderSent(leaseId, days);

      return {
        success: true,
        message: `Manual reminder sent for lease ${leaseId} (${days} days notice)`
      };
    } catch (error) {
      console.error('Error manually triggering reminder:', error);
      throw error;
    }
  }
}

module.exports = new LeaseReminderService();
