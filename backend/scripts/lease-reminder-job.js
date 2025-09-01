#!/usr/bin/env node

/**
 * Lease Reminder Cron Job
 * 
 * This script should be run daily to check for lease expirations
 * and send automatic reminder emails.
 * 
 * Add to crontab to run daily at 9 AM:
 * 0 9 * * * /usr/bin/node /path/to/rental-tracker/backend/scripts/lease-reminder-job.js
 * 
 * Or run manually:
 * node scripts/lease-reminder-job.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const leaseReminderService = require('../src/services/leaseReminderService');
const emailService = require('../src/services/emailService');

async function runLeaseReminderJob() {
  console.log('\n=== Lease Reminder Job Started ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Test email connection first
    console.log('Testing email service connection...');
    await emailService.testConnection();
    console.log('✅ Email service connection successful');
    
    // Run the reminder check
    console.log('Running lease reminder check...');
    const results = await leaseReminderService.checkAndSendReminders();
    
    // Log summary
    const summary = {
      total_processed: results.length,
      reminders_sent: results.filter(r => r.status === 'sent').length,
      already_sent: results.filter(r => r.status === 'already_sent').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    console.log('\n=== Job Summary ===');
    console.log('Total leases processed:', summary.total_processed);
    console.log('New reminders sent:', summary.reminders_sent);
    console.log('Already sent (skipped):', summary.already_sent);
    console.log('Errors:', summary.errors);
    
    if (summary.reminders_sent > 0) {
      console.log('\n=== Reminders Sent ===');
      results
        .filter(r => r.status === 'sent')
        .forEach(r => {
          console.log(`- Lease ${r.leaseId}: ${r.property} (${r.landlord}) - ${r.days} days notice`);
        });
    }
    
    if (summary.errors > 0) {
      console.log('\n=== Errors ===');
      results
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(`- Lease ${r.leaseId}: ${r.error}`);
        });
    }
    
    console.log('\n=== Lease Reminder Job Completed ===');
    console.log('End timestamp:', new Date().toISOString());
    
    // Exit with appropriate code
    process.exit(summary.errors > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n=== Job Failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Run the job
runLeaseReminderJob();
