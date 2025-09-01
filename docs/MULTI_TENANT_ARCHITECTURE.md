# Multi-Tenant Architecture Implementation

This document describes the comprehensive multi-tenant architecture implemented in the Rental Tracker application, ensuring complete data isolation between users.

## Overview

The application has been enhanced to be fully multi-tenant, where each user (realtor) has their own isolated set of:
- Contacts
- Properties 
- Leases
- Email logs
- Lease reminders

## Architecture Components

### 1. Database Level Security

#### Row Level Security (RLS) Policies
All tables now have RLS policies that automatically filter data based on the authenticated user:

- **Users Table**: Users can only view/update their own profile
- **Contacts Table**: Users can only access contacts they created (`realtor_id = auth.uid()`)
- **Properties Table**: Users can only access properties they created and own
- **Leases Table**: Users can only access leases for their properties and contacts
- **Email Logs**: Users can only see emails they sent
- **Lease Reminders**: Users can only see reminders for their leases

#### Enhanced Database Views
```sql
-- Automatically filtered views for easy querying
CREATE VIEW user_contacts AS SELECT * FROM contacts WHERE realtor_id = auth.uid();
CREATE VIEW user_properties AS SELECT * FROM properties WHERE realtor_id = auth.uid();
CREATE VIEW user_leases AS SELECT * FROM leases WHERE realtor_id = auth.uid();
```

#### Tenant Statistics Function
```sql
CREATE FUNCTION get_user_stats() RETURNS TABLE(
    total_contacts INTEGER,
    total_properties INTEGER,
    total_leases INTEGER,
    active_leases INTEGER,
    expiring_leases INTEGER
);
```

### 2. Application Level Security

#### Tenant Isolation Middleware (`tenantIsolation.js`)

**Core Functions:**
- `tenantIsolation`: Main middleware that sets tenant context for all requests
- `validateTenantOwnership`: Validates user owns specific resources
- `validateTenantRelationships`: Ensures cross-resource references are within tenant
- `getTenantQuery`: Helper for tenant-filtered queries
- `getTenantStats`: Gets tenant statistics

**Usage Example:**
```javascript
// Automatically applied to all protected routes
app.use('/api', tenantIsolation);

// Validate ownership for specific operations
router.get('/:id', validateTenantOwnership('contact'), getContact);

// Validate relationships when creating/updating
router.post('/', validateTenantRelationships({ 
  propertyId: 'property',
  tenantId: 'contact',
  landlordId: 'contact'
}), createLease);
```

### 3. Enhanced Route Protection

#### Contact Routes
```javascript
router.route('/:id')
  .get(validateTenantOwnership('contact'), getContact)
  .put(validateTenantOwnership('contact'), validateContactUpdate, updateContact)
  .delete(validateTenantOwnership('contact'), deleteContact);
```

#### Property Routes
```javascript
router.route('/')
  .post(
    validateTenantRelationships({ ownerId: 'contact' }),
    validateProperty, 
    createProperty
  );
```

#### Lease Routes
```javascript
router.route('/')
  .post(
    validateTenantRelationships({ 
      propertyId: 'property',
      tenantId: 'contact',
      landlordId: 'contact'
    }),
    createLease
  );
```

## Data Isolation Guarantees

### 1. Complete Tenant Separation
- Each user can only see and modify their own data
- No accidental data leakage between tenants
- Automatic filtering at database and application levels

### 2. Reference Integrity
- When creating leases, all referenced properties and contacts must belong to the same tenant
- Cross-tenant references are prevented at validation layer
- Database constraints ensure referential integrity within tenant boundaries

### 3. Audit Trail
- All updates include tenant validation
- Triggers prevent unauthorized modifications
- User context is maintained throughout the request lifecycle

## Security Features

### 1. Multiple Validation Layers

**Database Level:**
- RLS policies automatically filter all queries
- Check constraints prevent invalid data
- Foreign key constraints maintain relationships

**Application Level:**
- Middleware validates tenant ownership
- Route-level protection for all operations
- Cross-resource relationship validation

### 2. Secure by Default

**All new features automatically inherit tenant isolation:**
- RLS policies apply to all queries
- Middleware is applied globally
- Services use tenant-filtered queries

### 3. Performance Optimized

**Efficient tenant filtering:**
- Database indexes on tenant columns
- Optimized RLS policies
- Cached tenant statistics

## API Changes

### Enhanced Responses
All user-related endpoints now include tenant context:

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "registrationSource": "email",
    "tenantId": "user-uuid"
  }
}
```

### New Endpoints

#### Get Tenant Statistics
```
GET /api/dashboard/stats
```
Returns comprehensive tenant statistics using optimized database function.

#### Registration Analytics (Admin Only)
```
GET /api/auth/registration-stats
```
Returns registration source statistics for admin users.

## Migration Guide

### 1. Run Database Migration
```bash
# Apply the multi-tenant security migration
psql -f backend/migrations/009_enhance_multi_tenant_security.sql
```

### 2. Update Application Code
The middleware is automatically applied to all routes. No changes needed to existing controllers or services.

### 3. Verify Tenant Isolation
```sql
-- Test queries to verify isolation (run as different users)
SELECT COUNT(*) FROM contacts; -- Should only show user's contacts
SELECT COUNT(*) FROM properties; -- Should only show user's properties
SELECT COUNT(*) FROM leases; -- Should only show user's leases
```

## Development Guidelines

### 1. Creating New Features

**Always use tenant-filtered queries:**
```javascript
// Good
const contacts = await supabase
  .from('contacts')
  .select('*')
  .eq('realtor_id', userId);

// Bad - will be blocked by RLS anyway, but explicit is better
const contacts = await supabase
  .from('contacts')
  .select('*');
```

**Use validation middleware for new routes:**
```javascript
router.post('/', validateTenantRelationships({
  relatedField: 'resourceType'
}), createResource);
```

### 2. Testing Multi-Tenancy

**Test with multiple users:**
1. Create test users
2. Create data for each user
3. Verify users can only see their own data
4. Test cross-tenant operations (should fail)

**Automated tests:**
```javascript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant access', async () => {
    // Create data for user1
    // Try to access as user2
    // Should return 404 or empty results
  });
});
```

## Troubleshooting

### Common Issues

**1. "Access denied" errors:**
- Check if user is properly authenticated
- Verify RLS policies are active
- Ensure realtor_id is set correctly

**2. Empty results when data exists:**
- Verify user ID in token matches realtor_id in data
- Check RLS policies are not too restrictive
- Confirm middleware is applied in correct order

**3. Cross-resource validation failures:**
- Ensure all referenced resources belong to same tenant
- Check validation middleware configuration
- Verify foreign key relationships

### Debugging

**Check user context:**
```javascript
console.log('User ID:', req.user.id);
console.log('Tenant ID:', req.tenant.id);
```

**Verify RLS policies:**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Performance Considerations

### 1. Database Optimizations
- Indexes on all `realtor_id` columns
- Optimized RLS policies using function-based indexes
- Efficient tenant statistics function

### 2. Application Optimizations
- Cached tenant context
- Batch validation for multiple resources
- Optimized middleware order

### 3. Monitoring
- Track tenant-specific performance metrics
- Monitor RLS policy performance
- Alert on cross-tenant access attempts

## Future Enhancements

### 1. Advanced Features
- **Tenant Analytics Dashboard**: Detailed analytics per tenant
- **Data Export/Import**: Tenant-specific data operations
- **Resource Quotas**: Limit resources per tenant
- **Tenant Billing**: Usage-based billing per tenant

### 2. Scalability
- **Database Sharding**: Partition data by tenant for extreme scale
- **Tenant-specific Caching**: Redis namespacing by tenant
- **API Rate Limiting**: Per-tenant rate limits

### 3. Enterprise Features
- **Multi-Organization Support**: Support for brokerage hierarchies
- **Shared Resources**: Allow controlled resource sharing between tenants
- **Audit Logging**: Comprehensive audit trails per tenant
- **Backup/Restore**: Tenant-specific backup operations

## Compliance and Security

### 1. Data Privacy
- Complete data isolation ensures GDPR compliance
- Right to be forgotten supported per tenant
- Data portability per tenant

### 2. Security Standards
- Defense in depth with multiple validation layers
- Secure by default architecture
- Regular security audits supported

### 3. Compliance Reporting
- Tenant-specific access logs
- Data residency compliance
- Audit trail for compliance officers
