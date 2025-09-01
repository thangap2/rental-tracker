#!/usr/bin/env node

/**
 * Test Script for Lease Reminder System
 * 
 * This script tests the reminder functionality without actually sending emails
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const leaseReminderService = require('../src/services/leaseReminderService');

async function testReminderSystem() {
  console.log('\n=== Testing Lease Reminder System ===\n');
  
  try {
    // Test 1: Get leases expiring in the next 90 days
    console.log('1. Testing: Get leases expiring in next 90 days...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 90);
    
    const expiringLeases = await leaseReminderService.getLeasesExpiringInRange(startDate, endDate);
    console.log(`   Found ${expiringLeases.length} leases expiring in next 90 days`);
    
    if (expiringLeases.length > 0) {
      console.log('   Sample lease:');
      const sample = expiringLeases[0];
      console.log(`   - Property: ${sample.property?.title || 'Unknown'}`);
      console.log(`   - End Date: ${sample.end_date}`);
      console.log(`   - Landlord: ${sample.landlord?.first_name} ${sample.landlord?.last_name}`);
      console.log(`   - Realtor: ${sample.realtor?.first_name} ${sample.realtor?.last_name}`);
    }
    
    // Test 2: Check for leases expiring today + 30 days (30-day reminder test)
    console.log('\n2. Testing: Check leases expiring in exactly 30 days...');
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    
    const leases30Days = await leaseReminderService.getLeasesExpiringOn(thirtyDaysOut);
    console.log(`   Found ${leases30Days.length} leases expiring in exactly 30 days`);
    
    // Test 3: Check for leases expiring today + 60 days (60-day reminder test)
    console.log('\n3. Testing: Check leases expiring in exactly 60 days...');
    const sixtyDaysOut = new Date();
    sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);
    
    const leases60Days = await leaseReminderService.getLeasesExpiringOn(sixtyDaysOut);
    console.log(`   Found ${leases60Days.length} leases expiring in exactly 60 days`);
    
    // Test 4: Check for leases expiring today + 90 days (90-day reminder test)
    console.log('\n4. Testing: Check leases expiring in exactly 90 days...');
    const ninetyDaysOut = new Date();
    ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
    
    const leases90Days = await leaseReminderService.getLeasesExpiringOn(ninetyDaysOut);
    console.log(`   Found ${leases90Days.length} leases expiring in exactly 90 days`);
    
    // Test 5: Check reminder history for any lease
    if (expiringLeases.length > 0) {
      console.log('\n5. Testing: Check reminder history...');
      const testLeaseId = expiringLeases[0].id;
      const history = await leaseReminderService.getReminderHistory(testLeaseId);
      console.log(`   Reminder history for lease ${testLeaseId}: ${history.length} records`);
      
      if (history.length > 0) {
        history.forEach(record => {
          console.log(`   - ${record.reminder_days} day reminder sent on ${record.sent_at}`);
        });
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total expiring leases (90 days): ${expiringLeases.length}`);
    console.log(`Leases needing 30-day reminder: ${leases30Days.length}`);
    console.log(`Leases needing 60-day reminder: ${leases60Days.length}`);
    console.log(`Leases needing 90-day reminder: ${leases90Days.length}`);
    
    // Test 6: Dry run of reminder check (without sending emails)
    console.log('\n6. Testing: Dry run reminder check...');
    console.log('   Note: This would normally send emails, but we\'re just checking logic');
    
    const reminderDays = [90, 60, 30];
    let totalThatWouldBeSent = 0;
    
    for (const days of reminderDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const leasesForDay = await leaseReminderService.getLeasesExpiringOn(targetDate);
      
      for (const lease of leasesForDay) {
        const alreadySent = await leaseReminderService.checkReminderSent(lease.id, days);
        if (!alreadySent) {
          totalThatWouldBeSent++;
        }
      }
    }
    
    console.log(`   Would send ${totalThatWouldBeSent} reminder emails if run now`);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nTo run the actual reminder job with email sending:');
    console.log('   node scripts/lease-reminder-job.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nTest interrupted by user');
  process.exit(0);
});

// Run the test
testReminderSystem();
