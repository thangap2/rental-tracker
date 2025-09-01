const emailService = require('../services/emailService');
const { supabase } = require('../config/database');

// Helper method to send custom email
const sendCustomEmail = async (to, subject, message, lease = null, priority = 'normal') => {
  const transporter = emailService.transporter;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${subject}</h1>
      </div>
      <div class="content">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <div class="footer">
        <p>Sent via Rental Tracker System</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${process.env.COMPANY_NAME || 'Rental Tracker'}" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
    priority: priority
  });
};

// Helper method to log email
const logEmailSent = async (sentBy, recipientEmail, subject, message, emailType, contactId = null, leaseId = null) => {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        sent_by: sentBy,
        recipient_email: recipientEmail,
        subject: subject,
        message: message,
        email_type: emailType,
        contact_id: contactId,
        lease_id: leaseId,
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging email:', error);
    }
  } catch (error) {
    console.error('Error in logEmailSent:', error);
  }
};

// Helper method to record reminder
const recordReminderSent = async (leaseId, reminderDays) => {
  try {
    const { error } = await supabase
      .from('lease_reminders')
      .insert({
        lease_id: leaseId,
        reminder_days: reminderDays,
        sent_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error recording reminder:', error);
    }
  } catch (error) {
    console.error('Error in recordReminderSent:', error);
  }
};

// Generate custom lease email HTML
const generateCustomLeaseEmail = (lease, message, recipient) => {
  const recipientName = recipient === 'landlord' 
    ? `${lease.landlord.first_name} ${lease.landlord.last_name}`
    : `${lease.realtor.first_name} ${lease.realtor.last_name}`;

  const propertyAddress = lease.property 
    ? `${lease.property.street || ''}, ${lease.property.city || ''}, ${lease.property.state || ''}`.trim()
    : 'Unknown Property';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .lease-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Lease Communication</h1>
      </div>
      <div class="content">
        <p>Dear ${recipientName},</p>
        
        <div class="lease-info">
          <h3>Lease Details</h3>
          <p><strong>Property:</strong> ${propertyAddress}</p>
          <p><strong>Tenant:</strong> ${lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Unknown'}</p>
          <p><strong>Lease End Date:</strong> ${lease.end_date ? new Date(lease.end_date).toLocaleDateString() : 'Unknown'}</p>
        </div>
        
        <div>
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <p>Best regards,<br>
        ${lease.realtor.first_name} ${lease.realtor.last_name}<br>
        ${process.env.COMPANY_NAME || 'Rental Tracker System'}</p>
      </div>
      <div class="footer">
        <p>This email was sent via the Rental Tracker system.</p>
      </div>
    </body>
    </html>
  `;
};

// Helper method to send custom lease email
const sendCustomLeaseEmail = async (lease, customMessage) => {
  const landlordEmail = generateCustomLeaseEmail(lease, customMessage, 'landlord');
  const realtorEmail = generateCustomLeaseEmail(lease, customMessage, 'realtor');

  const transporter = emailService.transporter;

  // Send to landlord with CC to realtor
  await transporter.sendMail({
    from: `"${process.env.COMPANY_NAME || 'Rental Tracker'}" <${process.env.SMTP_USER}>`,
    to: lease.landlord.email,
    cc: lease.realtor.email,
    subject: `Regarding Your Lease - ${lease.property?.title || 'Property'}`,
    html: landlordEmail
  });

  // Send separate email to realtor
  await transporter.sendMail({
    from: `"${process.env.COMPANY_NAME || 'Rental Tracker'}" <${process.env.SMTP_USER}>`,
    to: lease.realtor.email,
    subject: `[Internal] Lease Communication - ${lease.property?.title || 'Property'}`,
    html: realtorEmail
  });
};

class EmailController {
  // Send custom emails to multiple recipients
  async sendEmails(req, res) {
    try {
      const { emails } = req.body;
      const realtorId = req.user.id;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Emails array is required'
        });
      }

      const results = [];
      const errors = [];

      for (const emailData of emails) {
        try {
          const { to, subject, message, priority = 'normal' } = emailData;

          if (!to || !subject || !message) {
            errors.push({
              email: to,
              error: 'Missing required fields (to, subject, message)'
            });
            continue;
          }

          // Create a mock email structure for the existing email service
          const mockLease = {
            id: 'custom-email',
            property: { title: 'Custom Email', street: '', city: '', state: '' },
            tenant: { first_name: '', last_name: '', email: to },
            landlord: { first_name: req.user.firstName, last_name: req.user.lastName, email: req.user.email },
            realtor: { first_name: req.user.firstName, last_name: req.user.lastName, email: req.user.email }
          };

          // Send email using existing service with custom template
          await sendCustomEmail(to, subject, message, mockLease, priority);

          // Log email in database
          await logEmailSent(realtorId, to, subject, message, 'custom');

          results.push({
            email: to,
            status: 'sent',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Error sending email to ${emailData.to}:`, error);
          errors.push({
            email: emailData.to,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Sent ${results.length} emails successfully`,
        results: {
          sent: results,
          failed: errors,
          total: emails.length,
          success_count: results.length,
          error_count: errors.length
        }
      });

    } catch (error) {
      console.error('Error in sendEmails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send emails',
        error: error.message
      });
    }
  }

  // Send emails to specific contacts
  async sendToContacts(req, res) {
    try {
      const { contactIds, subject, message, priority = 'normal' } = req.body;
      const realtorId = req.user.id;

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Contact IDs array is required'
        });
      }

      // Fetch contacts
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, contact_type')
        .in('id', contactIds)
        .eq('realtor_id', realtorId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const results = [];
      const errors = [];

      for (const contact of contacts) {
        try {
          if (!contact.email) {
            errors.push({
              contact: `${contact.first_name} ${contact.last_name}`,
              error: 'No email address'
            });
            continue;
          }

          await sendCustomEmail(
            contact.email, 
            subject, 
            message.replace(/{contact_name}/g, `${contact.first_name} ${contact.last_name}`),
            null,
            priority
          );

          await logEmailSent(realtorId, contact.email, subject, message, 'contact', contact.id);

          results.push({
            contact: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            status: 'sent'
          });

        } catch (error) {
          console.error(`Error sending email to ${contact.email}:`, error);
          errors.push({
            contact: `${contact.first_name} ${contact.last_name}`,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Sent emails to ${results.length} contacts`,
        results: {
          sent: results,
          failed: errors,
          total: contacts.length
        }
      });

    } catch (error) {
      console.error('Error in sendToContacts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send emails to contacts',
        error: error.message
      });
    }
  }

  // Send lease reminder with custom message
  async sendLeaseReminder(req, res) {
    try {
      const { leaseId, reminderType, customMessage } = req.body;
      const realtorId = req.user.id;

      // Validate reminder type
      const validTypes = ['30', '60', '90', 'custom'];
      if (!validTypes.includes(reminderType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reminder type. Must be 30, 60, 90, or custom'
        });
      }

      // Fetch lease with all related data
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
        .eq('realtor_id', realtorId)
        .single();

      if (error || !lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found or access denied'
        });
      }

      if (!lease.landlord?.email || !lease.realtor?.email) {
        return res.status(400).json({
          success: false,
          message: 'Missing required email addresses for landlord or realtor'
        });
      }

      if (reminderType === 'custom' && customMessage) {
        // Send custom message
        await sendCustomLeaseEmail(lease, customMessage);
      } else {
        // Send standard reminder using existing service
        const reminderDays = parseInt(reminderType);
        await emailService.sendLeaseExpirationReminder(
          lease.landlord,
          lease.realtor,
          lease,
          reminderDays
        );

        // Record the reminder
        await recordReminderSent(leaseId, reminderDays);
      }

      res.json({
        success: true,
        message: `Lease reminder sent successfully`,
        lease: {
          id: lease.id,
          property: lease.property?.title,
          landlord: `${lease.landlord.first_name} ${lease.landlord.last_name}`,
          reminderType
        }
      });

    } catch (error) {
      console.error('Error in sendLeaseReminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send lease reminder',
        error: error.message
      });
    }
  }

  // Get email history
  async getEmailHistory(req, res) {
    try {
      const realtorId = req.user.id;
      const { page = 1, limit = 20, type, contact_id, lease_id } = req.query;

      let query = supabase
        .from('email_logs')
        .select(`
          id,
          recipient_email,
          subject,
          message,
          email_type,
          sent_at,
          contact:contact_id (
            id,
            first_name,
            last_name
          ),
          lease:lease_id (
            id,
            property:property_id (
              title
            )
          )
        `)
        .eq('sent_by', realtorId)
        .order('sent_at', { ascending: false });

      if (type) {
        query = query.eq('email_type', type);
      }

      if (contact_id) {
        query = query.eq('contact_id', contact_id);
      }

      if (lease_id) {
        query = query.eq('lease_id', lease_id);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: emails, error, count } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: emails || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Error in getEmailHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email history',
        error: error.message
      });
    }
  }
}

module.exports = new EmailController();
