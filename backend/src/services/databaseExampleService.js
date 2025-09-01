// Example service demonstrating both REST and direct database access
const { supabase, db } = require('../config/database');

class DatabaseExampleService {
  // Example using Supabase REST client (existing approach)
  async getUsersViaRest() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users via REST:', error);
      throw error;
    }
  }

  // Example using direct PostgreSQL connection
  async getUsersViaDirect() {
    try {
      if (!db.isDirectConnectionAvailable()) {
        throw new Error('Direct database connection not available');
      }

      const query = `
        SELECT id, first_name, last_name, email, role, created_at
        FROM users 
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 10
      `;

      return await db.queryRows(query);
    } catch (error) {
      console.error('Error fetching users via direct connection:', error);
      throw error;
    }
  }

  // Example of complex query with joins (easier with direct SQL)
  async getLeaseDetailsWithJoins(leaseId) {
    try {
      if (!db.isDirectConnectionAvailable()) {
        // Fallback to REST API with multiple requests
        return await this.getLeaseDetailsViaRest(leaseId);
      }

      const query = `
        SELECT 
          l.id as lease_id,
          l.start_date,
          l.end_date,
          l.monthly_rent,
          l.security_deposit,
          l.status,
          
          p.id as property_id,
          p.title as property_title,
          p.street,
          p.city,
          p.state,
          p.zip_code,
          
          t.id as tenant_id,
          t.first_name as tenant_first_name,
          t.last_name as tenant_last_name,
          t.email as tenant_email,
          t.phone as tenant_phone,
          
          ll.id as landlord_id,
          ll.first_name as landlord_first_name,
          ll.last_name as landlord_last_name,
          ll.email as landlord_email,
          ll.phone as landlord_phone
          
        FROM leases l
        LEFT JOIN properties p ON l.property_id = p.id
        LEFT JOIN contacts t ON l.tenant_id = t.id
        LEFT JOIN contacts ll ON l.landlord_id = ll.id
        WHERE l.id = $1
      `;

      const result = await db.queryOne(query, [leaseId]);
      
      if (!result) return null;

      // Transform flat result into nested structure
      return {
        id: result.lease_id,
        start_date: result.start_date,
        end_date: result.end_date,
        monthly_rent: result.monthly_rent,
        security_deposit: result.security_deposit,
        status: result.status,
        property: {
          id: result.property_id,
          title: result.property_title,
          street: result.street,
          city: result.city,
          state: result.state,
          zip_code: result.zip_code
        },
        tenant: {
          id: result.tenant_id,
          first_name: result.tenant_first_name,
          last_name: result.tenant_last_name,
          email: result.tenant_email,
          phone: result.tenant_phone
        },
        landlord: {
          id: result.landlord_id,
          first_name: result.landlord_first_name,
          last_name: result.landlord_last_name,
          email: result.landlord_email,
          phone: result.landlord_phone
        }
      };
    } catch (error) {
      console.error('Error fetching lease details:', error);
      throw error;
    }
  }

  // Fallback method using REST API
  async getLeaseDetailsViaRest(leaseId) {
    try {
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select(`
          *,
          property:property_id(*),
          tenant:tenant_id(*),
          landlord:landlord_id(*)
        `)
        .eq('id', leaseId)
        .single();

      if (leaseError) throw leaseError;
      return lease;
    } catch (error) {
      console.error('Error fetching lease via REST:', error);
      throw error;
    }
  }

  // Example of bulk insert with transaction
  async bulkInsertWithTransaction(records) {
    try {
      if (!db.isDirectConnectionAvailable()) {
        throw new Error('Bulk operations require direct database connection');
      }

      return await db.transaction(async (client) => {
        const results = [];
        
        for (const record of records) {
          const query = `
            INSERT INTO contacts (first_name, last_name, email, phone, realtor_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, first_name, last_name, email
          `;
          
          const result = await client.query(query, [
            record.first_name,
            record.last_name,
            record.email,
            record.phone,
            record.realtor_id
          ]);
          
          results.push(result.rows[0]);
        }
        
        return results;
      });
    } catch (error) {
      console.error('Error in bulk insert transaction:', error);
      throw error;
    }
  }

  // Example of complex aggregation query
  async getLeaseAnalytics() {
    try {
      if (!db.isDirectConnectionAvailable()) {
        // Would need multiple REST calls and client-side aggregation
        throw new Error('Analytics require direct database connection');
      }

      const query = `
        SELECT 
          COUNT(*) as total_leases,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_leases,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_leases,
          AVG(monthly_rent) as avg_monthly_rent,
          SUM(monthly_rent) as total_monthly_rent,
          COUNT(CASE WHEN end_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon
        FROM leases
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
      `;

      return await db.queryOne(query);
    } catch (error) {
      console.error('Error fetching lease analytics:', error);
      throw error;
    }
  }

  // Hybrid approach: use direct DB for complex queries, REST for simple ones
  async getLeasesByStatus(status, useDirectDb = false) {
    try {
      if (useDirectDb && db.isDirectConnectionAvailable()) {
        const query = `
          SELECT 
            l.*,
            json_build_object(
              'id', p.id,
              'title', p.title,
              'street', p.street,
              'city', p.city,
              'state', p.state
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
          WHERE l.status = $1
          ORDER BY l.end_date ASC
        `;

        return await db.queryRows(query, [status]);
      } else {
        // Use REST API
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            property:property_id(id, title, street, city, state),
            tenant:tenant_id(id, first_name, last_name, email)
          `)
          .eq('status', status)
          .order('end_date', { ascending: true });

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error fetching leases by status:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseExampleService();
