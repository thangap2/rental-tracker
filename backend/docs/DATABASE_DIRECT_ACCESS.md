# Direct PostgreSQL Database Access

This configuration adds direct PostgreSQL database access to the existing Supabase REST client, giving you the flexibility to use both approaches depending on your needs.

## Configuration

### Environment Variables

Add these optional environment variables to your `.env` file:

```env
# Direct PostgreSQL Database Configuration (optional)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_database_password
```

If not provided, the system will auto-extract the database host from your `SUPABASE_URL` and fall back to REST API only.

### Getting Your Database Password

1. Go to your Supabase dashboard
2. Navigate to Settings → Database
3. Find your connection string or reset your database password
4. Add the password to your `.env` file as `DB_PASSWORD`

## Usage

### Import the Database Module

```javascript
const { supabase, db } = require('../config/database');
```

### Check Connection Availability

```javascript
if (db.isDirectConnectionAvailable()) {
  // Use direct connection
} else {
  // Fall back to REST API
}
```

### Basic Queries

```javascript
// Execute raw SQL with parameters
const users = await db.queryRows(
  'SELECT * FROM users WHERE role = $1 LIMIT $2',
  ['realtor', 10]
);

// Get a single row
const user = await db.queryOne(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// Execute any query (returns full result object)
const result = await db.query('SELECT COUNT(*) FROM leases');
console.log(result.rowCount); // Number of rows affected
console.log(result.rows);     // Array of result rows
```

### Transactions

```javascript
const result = await db.transaction(async (client) => {
  // All queries within this function will be in a transaction
  await client.query('INSERT INTO contacts (...) VALUES (...)', [...]);
  await client.query('INSERT INTO leases (...) VALUES (...)', [...]);
  
  // If any query fails, the entire transaction will be rolled back
  return 'success';
});
```

### Complex Queries with Joins

```javascript
// This is much easier with direct SQL than multiple REST calls
const leaseDetails = await db.queryOne(`
  SELECT 
    l.*,
    json_build_object(
      'id', p.id,
      'title', p.title,
      'street', p.street,
      'city', p.city
    ) as property,
    json_build_object(
      'id', t.id,
      'first_name', t.first_name,
      'last_name', t.last_name,
      'email', t.email
    ) as tenant
  FROM leases l
  LEFT JOIN properties p ON l.property_id = p.id
  LEFT JOIN contacts t ON l.tenant_id = t.id
  WHERE l.id = $1
`, [leaseId]);
```

### Aggregations and Analytics

```javascript
// Complex aggregations are much more efficient with direct SQL
const analytics = await db.queryOne(`
  SELECT 
    COUNT(*) as total_leases,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_leases,
    AVG(monthly_rent) as avg_rent,
    SUM(monthly_rent) as total_rent
  FROM leases
  WHERE created_at >= $1
`, [oneYearAgo]);
```

## When to Use Each Method

### Use REST API (Supabase client) when:
- Performing simple CRUD operations
- You need Row Level Security (RLS) policies
- Working with real-time subscriptions
- Building frontend applications
- You want built-in type safety and validation

### Use Direct Database when:
- Performing complex queries with multiple joins
- Need transactions across multiple tables
- Running aggregations and analytics
- Bulk operations
- Custom SQL functions or procedures
- Performance is critical

## API Endpoints

The system includes example endpoints to demonstrate both approaches:

- `GET /api/database/test-connections` - Test both REST and direct connections
- `GET /api/database/leases/:id/detailed` - Get lease with all related data in one query
- `GET /api/database/analytics` - Get aggregated lease statistics
- `GET /api/database/table-info/:tableName` - Get table schema information
- `POST /api/database/execute-query` - Execute custom SQL (admin only)
- `GET /api/database/performance-test` - Compare REST vs direct performance

## Error Handling

The system gracefully falls back to REST API if direct connection fails:

```javascript
// Hybrid approach
async getLeaseData(leaseId) {
  if (db.isDirectConnectionAvailable()) {
    return await this.getLeaseWithDirectSQL(leaseId);
  } else {
    return await this.getLeaseWithREST(leaseId);
  }
}
```

## Security Considerations

1. **RLS Bypass**: Direct database queries bypass Row Level Security policies
2. **SQL Injection**: Always use parameterized queries (`$1`, `$2`, etc.)
3. **Admin Only**: Restrict direct query execution to admin users only
4. **Production Safety**: Only allow SELECT queries in production environment

## Performance Benefits

Direct database access can be significantly faster for:
- Complex joins (1 query vs multiple REST calls)
- Aggregations and analytics
- Bulk operations
- Large result sets

## Connection Pooling

The system uses connection pooling with these default settings:
- Maximum 20 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Graceful Shutdown

The database pool will be properly closed when the application shuts down:

```javascript
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

## Examples in Code

See these files for complete examples:
- `src/services/databaseExampleService.js` - Service layer examples
- `src/controllers/databaseExampleController.js` - Controller examples
- `src/routes/databaseExample.js` - API endpoint definitions
