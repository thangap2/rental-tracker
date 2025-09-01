const { supabase } = require('../config/database');

class LeaseService {
  async findAll(realtorId, filters = {}) {
    let query = supabase
      .from('leases')
      .select(`
        *,
        property:property_id (
          id,
          title,
          street,
          city,
          state,
          zip_code
        )
      `)
      .eq('realtor_id', realtorId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.propertyId) {
      query = query.eq('property_id', filters.propertyId);
    }

    if (filters.tenantId) {
      // When filtering by tenant, we need to join with the lease_tenants table
      query = query.in('id', 
        supabase
          .from('lease_tenants')
          .select('lease_id')
          .eq('tenant_id', filters.tenantId)
          .then(({ data }) => data?.map(lt => lt.lease_id) || [])
      );
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data: leases, error } = await query;

    if (error) throw error;

    // For each lease, fetch its tenants and landlords
    const leasesWithRelations = await Promise.all(
      (leases || []).map(async (lease) => {
        try {
          // Get tenants for this lease
          const { data: tenants } = await supabase
            .rpc('get_lease_tenants', { lease_uuid: lease.id });

          // Get landlords for this lease
          const { data: landlords } = await supabase
            .rpc('get_lease_landlords', { lease_uuid: lease.id });

          lease.tenants = tenants || [];
          lease.landlords = landlords || [];

          // Maintain backward compatibility with single tenant/landlord
          lease.tenant = lease.tenants.find(t => t.is_primary) || lease.tenants[0] || null;
          lease.landlord = lease.landlords.find(l => l.is_primary) || lease.landlords[0] || null;

          return lease;
        } catch (err) {
          console.warn(`Error fetching relations for lease ${lease.id}:`, err);
          lease.tenants = [];
          lease.landlords = [];
          lease.tenant = null;
          lease.landlord = null;
          return lease;
        }
      })
    );

    return leasesWithRelations;
  }

  async findById(id, realtorId) {
    // Get the lease with property information
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        *,
        property:property_id (
          *
        )
      `)
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .single();

    if (leaseError) throw leaseError;
    if (!lease) return null;

    // Get tenants for this lease
    const { data: tenants, error: tenantsError } = await supabase
      .rpc('get_lease_tenants', { lease_uuid: id });

    if (tenantsError) {
      console.warn('Could not fetch tenants:', tenantsError);
      lease.tenants = [];
    } else {
      lease.tenants = tenants || [];
    }

    // Get landlords for this lease
    const { data: landlords, error: landlordsError } = await supabase
      .rpc('get_lease_landlords', { lease_uuid: id });

    if (landlordsError) {
      console.warn('Could not fetch landlords:', landlordsError);
      lease.landlords = [];
    } else {
      lease.landlords = landlords || [];
    }

    // Maintain backward compatibility
    lease.tenant = lease.tenants.find(t => t.is_primary) || lease.tenants[0] || null;
    lease.landlord = lease.landlords.find(l => l.is_primary) || lease.landlords[0] || null;

    return lease;
  }

  async create(leaseData, realtorId) {
    // Start a transaction-like operation
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .insert([
        {
          property_id: leaseData.property || leaseData.propertyId,
          // Keep old columns for backward compatibility during transition
          tenant_id: Array.isArray(leaseData.tenants) ? leaseData.tenants[0]?.id : leaseData.tenant,
          landlord_id: Array.isArray(leaseData.landlords) ? leaseData.landlords[0]?.id : leaseData.landlord,
          start_date: leaseData.startDate,
          end_date: leaseData.endDate,
          monthly_rent: leaseData.monthlyRent,
          security_deposit: leaseData.securityDeposit || 0,
          lease_type: leaseData.leaseType,
          status: leaseData.status || 'pending',
          renewal_option: leaseData.renewalOption || false,
          auto_renewal: leaseData.autoRenewal || false,
          notice_required: leaseData.noticeRequired || 30,
          additional_terms: leaseData.additionalTerms,
          documents: leaseData.documents || [],
          payments: leaseData.payments || [],
          reminders: leaseData.reminders || [],
          realtor_id: realtorId,
        },
      ])
      .select('*')
      .single();

    if (leaseError) throw leaseError;

    // Handle multiple tenants
    const tenants = Array.isArray(leaseData.tenants) ? leaseData.tenants : 
                   leaseData.tenant ? [{ id: leaseData.tenant, isPrimary: true }] : 
                   leaseData.tenantId ? [{ id: leaseData.tenantId, isPrimary: true }] : [];

    if (tenants.length > 0) {
      const tenantInserts = tenants.map((tenant, index) => ({
        lease_id: lease.id,
        tenant_id: tenant.id,
        is_primary: tenant.isPrimary !== undefined ? tenant.isPrimary : index === 0,
        rent_responsibility: tenant.rentResponsibility || (index === 0 ? leaseData.monthlyRent : null)
      }));

      const { error: tenantsError } = await supabase
        .from('lease_tenants')
        .insert(tenantInserts);

      if (tenantsError) {
        // Rollback: delete the lease if tenant insertion fails
        await supabase.from('leases').delete().eq('id', lease.id);
        throw tenantsError;
      }
    }

    // Handle multiple landlords
    const landlords = Array.isArray(leaseData.landlords) ? leaseData.landlords : 
                     leaseData.landlord ? [{ id: leaseData.landlord, isPrimary: true }] : 
                     leaseData.landlordId ? [{ id: leaseData.landlordId, isPrimary: true }] : [];

    if (landlords.length > 0) {
      const landlordInserts = landlords.map((landlord, index) => ({
        lease_id: lease.id,
        landlord_id: landlord.id,
        is_primary: landlord.isPrimary !== undefined ? landlord.isPrimary : index === 0,
        ownership_percentage: landlord.ownershipPercentage || (index === 0 ? 100.00 : null)
      }));

      const { error: landlordsError } = await supabase
        .from('lease_landlords')
        .insert(landlordInserts);

      if (landlordsError) {
        // Rollback: delete the lease and tenants if landlord insertion fails
        await supabase.from('lease_tenants').delete().eq('lease_id', lease.id);
        await supabase.from('leases').delete().eq('id', lease.id);
        throw landlordsError;
      }
    }

    // Return the complete lease with relationships
    return await this.findById(lease.id, realtorId);
  }

  async update(id, leaseData, realtorId) {
    const updateData = {};
    
    if (leaseData.property) updateData.property_id = leaseData.property;
    if (leaseData.tenant) updateData.tenant_id = leaseData.tenant;
    if (leaseData.landlord) updateData.landlord_id = leaseData.landlord;
    if (leaseData.startDate) updateData.start_date = leaseData.startDate;
    if (leaseData.endDate) updateData.end_date = leaseData.endDate;
    if (leaseData.monthlyRent !== undefined) updateData.monthly_rent = leaseData.monthlyRent;
    if (leaseData.securityDeposit !== undefined) updateData.security_deposit = leaseData.securityDeposit;
    if (leaseData.leaseType) updateData.lease_type = leaseData.leaseType;
    if (leaseData.status) updateData.status = leaseData.status;
    if (leaseData.renewalOption !== undefined) updateData.renewal_option = leaseData.renewalOption;
    if (leaseData.autoRenewal !== undefined) updateData.auto_renewal = leaseData.autoRenewal;
    if (leaseData.noticeRequired !== undefined) updateData.notice_required = leaseData.noticeRequired;
    if (leaseData.additionalTerms !== undefined) updateData.additional_terms = leaseData.additionalTerms;
    if (leaseData.documents !== undefined) updateData.documents = leaseData.documents;
    if (leaseData.payments !== undefined) updateData.payments = leaseData.payments;
    if (leaseData.reminders !== undefined) updateData.reminders = leaseData.reminders;

    const { data, error } = await supabase
      .from('leases')
      .update(updateData)
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .select(`
        *,
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
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id, realtorId) {
    const { data, error } = await supabase
      .from('leases')
      .delete()
      .eq('id', id)
      .eq('realtor_id', realtorId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async findExpiring(realtorId, days = 30) {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
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
        )
      `)
      .eq('realtor_id', realtorId)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', futureDateStr)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findRecent(realtorId, limit = 5) {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
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
        )
      `)
      .eq('realtor_id', realtorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getStats(realtorId) {
    // Get lease counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('leases')
      .select('status')
      .eq('realtor_id', realtorId);

    if (statusError) throw statusError;

    // Count active leases
    const activeLeases = statusCounts.filter(lease => lease.status === 'active').length;
    const totalLeases = statusCounts.length;

    // Get monthly revenue from active leases
    const { data: activeRentData, error: rentError } = await supabase
      .from('leases')
      .select('monthly_rent')
      .eq('realtor_id', realtorId)
      .eq('status', 'active');

    if (rentError) throw rentError;

    const monthlyRevenue = activeRentData.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0);

    return {
      totalLeases,
      activeLeases,
      monthlyRevenue,
      statusCounts: statusCounts.reduce((acc, lease) => {
        acc[lease.status] = (acc[lease.status] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  async count(realtorId, filters = {}) {
    let query = supabase
      .from('leases')
      .select('*', { count: 'exact', head: true })
      .eq('realtor_id', realtorId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count;
  }
}

module.exports = new LeaseService();
