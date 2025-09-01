const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify connection configuration
    this.transporter.verify(function(error, success) {
      if (error) {
        console.log('Email service configuration error:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async sendLeaseExpirationReminder(landlord, realtor, lease, daysUntilExpiration) {
    const subject = `Lease Expiration Reminder - ${daysUntilExpiration} Days Notice`;
    const propertyAddress = this.formatPropertyAddress(lease.property);
    const tenantName = `${lease.tenant.first_name} ${lease.tenant.last_name}`;
    
    const landlordEmailContent = this.generateLandlordEmailContent({
      landlord,
      lease,
      daysUntilExpiration,
      propertyAddress,
      tenantName,
      realtor
    });

    const realtorEmailContent = this.generateRealtorEmailContent({
      landlord,
      lease,
      daysUntilExpiration,
      propertyAddress,
      tenantName,
      realtor
    });

    try {
      // Send email to landlord
      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Rental Tracker'}" <${process.env.SMTP_USER}>`,
        to: landlord.email,
        cc: realtor.email,
        subject,
        html: landlordEmailContent
      });

      // Send separate email to realtor with additional details
      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Rental Tracker'}" <${process.env.SMTP_USER}>`,
        to: realtor.email,
        subject: `[Internal] ${subject}`,
        html: realtorEmailContent
      });

      console.log(`Reminder emails sent for lease ${lease.id} (${daysUntilExpiration} days notice)`);
      return true;
    } catch (error) {
      console.error('Error sending reminder emails:', error);
      throw error;
    }
  }

  generateLandlordEmailContent({ landlord, lease, daysUntilExpiration, propertyAddress, tenantName, realtor }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .property-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .important { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
          .contact-info { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lease Expiration Reminder</h1>
          <p>${daysUntilExpiration} Days Notice</p>
        </div>
        
        <div class="content">
          <p>Dear ${landlord.first_name} ${landlord.last_name},</p>
          
          <div class="important">
            <strong>Important:</strong> Your lease agreement will expire in <strong>${daysUntilExpiration} days</strong>.
          </div>
          
          <div class="property-info">
            <h3>Lease Details</h3>
            <p><strong>Property:</strong> ${propertyAddress}</p>
            <p><strong>Tenant:</strong> ${tenantName}</p>
            <p><strong>Lease End Date:</strong> ${new Date(lease.end_date).toLocaleDateString()}</p>
            <p><strong>Monthly Rent:</strong> $${lease.monthly_rent}</p>
            <p><strong>Lease Type:</strong> ${lease.lease_type}</p>
          </div>
          
          <h3>Next Steps</h3>
          <p>Please consider the following actions:</p>
          <ul>
            <li><strong>Lease Renewal:</strong> Contact your tenant to discuss renewal terms</li>
            <li><strong>Property Inspection:</strong> Schedule a property inspection if renewal is planned</li>
            <li><strong>Market Analysis:</strong> Review current rental rates in your area</li>
            <li><strong>Notice Requirements:</strong> Ensure compliance with local notice requirements</li>
          </ul>
          
          <div class="contact-info">
            <h3>Your Realtor Contact Information</h3>
            <p><strong>Name:</strong> ${realtor.first_name} ${realtor.last_name}</p>
            <p><strong>Email:</strong> ${realtor.email}</p>
            <p><strong>Phone:</strong> ${realtor.phone || 'Not provided'}</p>
            <p><strong>Brokerage:</strong> ${realtor.brokerage || 'Not provided'}</p>
          </div>
          
          <p>If you have any questions or need assistance with the lease renewal process, please don't hesitate to contact your realtor.</p>
          
          <p>Best regards,<br>
          ${realtor.first_name} ${realtor.last_name}<br>
          ${process.env.COMPANY_NAME || 'Rental Tracker System'}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from the Rental Tracker system.</p>
          <p>Please do not reply to this email. Contact your realtor directly for assistance.</p>
        </div>
      </body>
      </html>
    `;
  }

  generateRealtorEmailContent({ landlord, lease, daysUntilExpiration, propertyAddress, tenantName, realtor }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .lease-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .action-items { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
          .contact-details { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Internal: Lease Expiration Alert</h1>
          <p>${daysUntilExpiration} Days Notice</p>
        </div>
        
        <div class="content">
          <p>Hello ${realtor.first_name},</p>
          
          <p>This is an automated reminder that one of your managed leases will expire in <strong>${daysUntilExpiration} days</strong>.</p>
          
          <div class="lease-details">
            <h3>Lease Information</h3>
            <p><strong>Property:</strong> ${propertyAddress}</p>
            <p><strong>Tenant:</strong> ${tenantName} (${lease.tenant.email})</p>
            <p><strong>Landlord:</strong> ${landlord.first_name} ${landlord.last_name} (${landlord.email})</p>
            <p><strong>Lease End Date:</strong> ${new Date(lease.end_date).toLocaleDateString()}</p>
            <p><strong>Monthly Rent:</strong> $${lease.monthly_rent}</p>
            <p><strong>Security Deposit:</strong> $${lease.security_deposit || '0.00'}</p>
            <p><strong>Lease Type:</strong> ${lease.lease_type}</p>
            <p><strong>Lease ID:</strong> ${lease.id}</p>
          </div>
          
          <div class="action-items">
            <h3>Recommended Actions</h3>
            <ul>
              <li><strong>Contact Landlord:</strong> Follow up on their renewal intentions</li>
              <li><strong>Market Analysis:</strong> Prepare current market rent analysis</li>
              <li><strong>Documentation:</strong> Prepare renewal paperwork if needed</li>
              <li><strong>Tenant Communication:</strong> Coordinate tenant outreach if requested</li>
              <li><strong>Property Marketing:</strong> Prepare marketing materials if not renewing</li>
            </ul>
          </div>
          
          <div class="contact-details">
            <h3>Contact Information</h3>
            <p><strong>Landlord:</strong> ${landlord.first_name} ${landlord.last_name}</p>
            <p><strong>Email:</strong> ${landlord.email}</p>
            <p><strong>Phone:</strong> ${landlord.phone || 'Not provided'}</p>
            <p><strong>Tenant:</strong> ${tenantName}</p>
            <p><strong>Email:</strong> ${lease.tenant.email}</p>
            <p><strong>Phone:</strong> ${lease.tenant.phone || 'Not provided'}</p>
          </div>
          
          <p><strong>Note:</strong> A copy of this reminder has been sent to the landlord with your contact information.</p>
          
          <p>Best regards,<br>
          Rental Tracker System</p>
        </div>
        
        <div class="footer">
          <p>This is an automated internal notification from the Rental Tracker system.</p>
          <p>Manage your reminders and settings in the Rental Tracker dashboard.</p>
        </div>
      </body>
      </html>
    `;
  }

  formatPropertyAddress(property) {
    if (!property) return 'Unknown Property';
    const parts = [];
    if (property.street) parts.push(property.street);
    if (property.city) parts.push(property.city);
    if (property.state) parts.push(property.state);
    if (property.zip_code) parts.push(property.zip_code);
    return parts.join(', ') || 'Unknown Address';
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection is ready');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
