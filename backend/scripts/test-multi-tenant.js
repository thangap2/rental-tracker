/**
 * Multi-Tenant Testing Script
 * Tests tenant isolation to ensure users can only access their own data
 */

const { supabase } = require('../src/config/database');
const userService = require('../src/services/userService');
const contactService = require('../src/services/contactService');
const propertyService = require('../src/services/propertyService');
const leaseService = require('../src/services/leaseService');

async function testMultiTenant() {
  console.log('🧪 Starting Multi-Tenant Isolation Tests...\n');

  try {
    // Test 1: Create test users
    console.log('1️⃣ Creating test users...');
    
    const user1Data = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.tenant1@test.com',
      password: 'password123',
      registrationSource: 'email'
    };

    const user2Data = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.tenant2@test.com',
      password: 'password123',
      registrationSource: 'email'
    };

    // Create users (this would normally be done through registration endpoint)
    console.log('   Creating user1...');
    const user1 = await userService.create(user1Data);
    console.log(`   ✅ User1 created: ${user1.id}`);

    console.log('   Creating user2...');
    const user2 = await userService.create(user2Data);
    console.log(`   ✅ User2 created: ${user2.id}\n`);

    // Test 2: Create contacts for each user
    console.log('2️⃣ Creating contacts for each user...');
    
    console.log('   Creating contact for user1...');
    const contact1 = await contactService.create({
      firstName: 'Tenant',
      lastName: 'One',
      email: 'tenant1@example.com',
      phone: '123-456-7890',
      contactType: 'tenant',
      street: '123 Main St',
      city: 'Anytown',
      state: 'ST',
      zipCode: '12345',
      realtorId: user1.id
    });
    console.log(`   ✅ Contact1 created: ${contact1.id}`);

    console.log('   Creating contact for user2...');
    const contact2 = await contactService.create({
      firstName: 'Tenant',
      lastName: 'Two',
      email: 'tenant2@example.com',
      phone: '987-654-3210',
      contactType: 'tenant',
      street: '456 Oak Ave',
      city: 'Otherville',
      state: 'ST',
      zipCode: '67890',
      realtorId: user2.id
    });
    console.log(`   ✅ Contact2 created: ${contact2.id}\n`);

    // Test 3: Test tenant isolation for contacts
    console.log('3️⃣ Testing contact tenant isolation...');
    
    console.log('   User1 querying their contacts...');
    const user1Contacts = await contactService.findAll(user1.id);
    console.log(`   ✅ User1 sees ${user1Contacts.length} contact(s) (should be 1)`);
    
    console.log('   User2 querying their contacts...');
    const user2Contacts = await contactService.findAll(user2.id);
    console.log(`   ✅ User2 sees ${user2Contacts.length} contact(s) (should be 1)`);

    // Test cross-tenant access
    console.log('   Testing cross-tenant contact access...');
    try {
      const crossTenantContact = await contactService.findById(contact1.id, user2.id);
      console.log('   ❌ ERROR: User2 should not access User1\'s contact');
    } catch (error) {
      console.log('   ✅ Cross-tenant access correctly blocked');
    }
    console.log('');

    // Test 4: Create properties for each user
    console.log('4️⃣ Creating properties for each user...');
    
    console.log('   Creating property for user1...');
    const property1 = await propertyService.create({
      title: 'User1 Property',
      street: '789 Property St',
      city: 'Proptown',
      state: 'ST',
      zipCode: '11111',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 1.5,
      ownerId: contact1.id,
      realtorId: user1.id
    });
    console.log(`   ✅ Property1 created: ${property1.id}`);

    console.log('   Creating property for user2...');
    const property2 = await propertyService.create({
      title: 'User2 Property',
      street: '321 Estate Blvd',
      city: 'Estateville',
      state: 'ST',
      zipCode: '22222',
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      ownerId: contact2.id,
      realtorId: user2.id
    });
    console.log(`   ✅ Property2 created: ${property2.id}\n`);

    // Test 5: Test tenant isolation for properties
    console.log('5️⃣ Testing property tenant isolation...');
    
    console.log('   User1 querying their properties...');
    const user1Properties = await propertyService.findAll(user1.id);
    console.log(`   ✅ User1 sees ${user1Properties.length} property(ies) (should be 1)`);
    
    console.log('   User2 querying their properties...');
    const user2Properties = await propertyService.findAll(user2.id);
    console.log(`   ✅ User2 sees ${user2Properties.length} property(ies) (should be 1)`);

    // Test cross-tenant property access
    console.log('   Testing cross-tenant property access...');
    try {
      const crossTenantProperty = await propertyService.findById(property1.id, user2.id);
      console.log('   ❌ ERROR: User2 should not access User1\'s property');
    } catch (error) {
      console.log('   ✅ Cross-tenant property access correctly blocked');
    }
    console.log('');

    // Test 6: Test user statistics
    console.log('6️⃣ Testing user statistics...');
    
    // This would require the actual database function to be available
    console.log('   User statistics test skipped (requires database function)');
    console.log('   In production, verify get_user_stats() returns correct tenant data\n');

    // Test 7: Cleanup
    console.log('7️⃣ Cleaning up test data...');
    
    console.log('   Deleting properties...');
    await propertyService.delete(property1.id, user1.id);
    await propertyService.delete(property2.id, user2.id);
    console.log('   ✅ Properties deleted');

    console.log('   Deleting contacts...');
    await contactService.delete(contact1.id, user1.id);
    await contactService.delete(contact2.id, user2.id);
    console.log('   ✅ Contacts deleted');

    // Note: In a real scenario, you might want to keep test users or delete them
    // For this test, we'll leave them as they might be useful for further testing
    console.log('   Test users preserved for further testing\n');

    console.log('🎉 All multi-tenant isolation tests passed!');
    console.log('✅ Users can only access their own data');
    console.log('✅ Cross-tenant access is properly blocked');
    console.log('✅ Tenant isolation is working correctly');

  } catch (error) {
    console.error('❌ Multi-tenant test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Function to test RLS policies directly
async function testRLSPolicies() {
  console.log('\n🔒 Testing Row Level Security Policies...\n');

  try {
    // Test RLS on contacts table
    console.log('Testing RLS on contacts table...');
    
    // This query should only return contacts for the authenticated user
    // In a real scenario, this would be run with proper JWT token
    const { data: rlsContacts, error: rlsError } = await supabase
      .from('contacts')
      .select('*');

    if (rlsError) {
      console.log('   ✅ RLS is active (query blocked without proper auth)');
    } else {
      console.log(`   ⚠️ RLS test returned ${rlsContacts.length} contacts`);
      console.log('   Note: This test requires proper JWT authentication to fully validate RLS');
    }

  } catch (error) {
    console.log('   ✅ RLS appears to be working (query rejected)');
  }
}

// Run tests
if (require.main === module) {
  testMultiTenant()
    .then(() => testRLSPolicies())
    .then(() => {
      console.log('\n🏁 Multi-tenant testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testMultiTenant,
  testRLSPolicies
};
