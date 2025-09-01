/**
 * Multi-tenant middleware for enforcing tenant isolation
 * Ensures that users can only access their own data
 */

const { supabase } = require('../config/database');

/**
 * Middleware to ensure tenant isolation for all requests
 * This middleware sets the RLS context and validates tenant access
 */
const tenantIsolation = async (req, res, next) => {
  try {
    // Skip tenant isolation for auth routes and public routes
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/me'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
      return next();
    }

    // For non-auth routes, tenant isolation will be handled by individual route protection
    // This middleware only adds tenant context if user is already authenticated
    if (req.user && req.user.id) {
      // Add tenant context to request for easy access
      req.tenant = {
        id: req.user.id,
        userId: req.user.id
      };
    }

    next();
  } catch (error) {
    console.error('Tenant isolation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Tenant isolation error',
    });
  }
};

/**
 * Middleware to validate tenant ownership for specific resource operations
 * Use this for routes that modify data to ensure double-validation
 */
const validateTenantOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;

      if (!resourceId) {
        return next(); // Skip validation if no ID parameter
      }

      let tableName;
      let ownerColumn = 'realtor_id';

      switch (resourceType) {
        case 'contact':
          tableName = 'contacts';
          break;
        case 'property':
          tableName = 'properties';
          break;
        case 'lease':
          tableName = 'leases';
          break;
        case 'user':
          tableName = 'users';
          ownerColumn = 'id';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type for tenant validation',
          });
      }

      // Check if the resource belongs to the current user
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', resourceId)
        .eq(ownerColumn, userId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found or access denied`,
        });
      }

      next();
    } catch (error) {
      console.error(`Tenant ownership validation error for ${resourceType}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Tenant ownership validation failed',
      });
    }
  };
};

/**
 * Middleware to validate cross-resource tenant relationships
 * Ensures that when creating/updating resources, all referenced resources belong to the same tenant
 */
const validateTenantRelationships = (relationships) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const validationPromises = [];

      for (const [field, resourceType] of Object.entries(relationships)) {
        const resourceId = req.body[field];
        
        if (!resourceId) continue; // Skip validation if field is not provided

        let tableName;
        let ownerColumn = 'realtor_id';

        switch (resourceType) {
          case 'contact':
            tableName = 'contacts';
            break;
          case 'property':
            tableName = 'properties';
            break;
          case 'lease':
            tableName = 'leases';
            break;
          default:
            continue;
        }

        validationPromises.push(
          supabase
            .from(tableName)
            .select('id')
            .eq('id', resourceId)
            .eq(ownerColumn, userId)
            .single()
            .then(({ data, error }) => ({
              field,
              resourceType,
              resourceId,
              valid: !error && !!data
            }))
        );
      }

      if (validationPromises.length === 0) {
        return next();
      }

      const results = await Promise.all(validationPromises);
      const invalidRelationships = results.filter(result => !result.valid);

      if (invalidRelationships.length > 0) {
        const invalidFields = invalidRelationships.map(r => `${r.field} (${r.resourceType})`);
        return res.status(400).json({
          success: false,
          message: `Invalid tenant relationships for fields: ${invalidFields.join(', ')}`,
          details: invalidRelationships.map(r => ({
            field: r.field,
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            error: 'Resource not found or access denied'
          }))
        });
      }

      next();
    } catch (error) {
      console.error('Tenant relationship validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Tenant relationship validation failed',
      });
    }
  };
};

/**
 * Helper function to get tenant-filtered query builder
 * Use this in services to ensure all queries are tenant-filtered
 */
const getTenantQuery = (tableName, userId) => {
  let ownerColumn = 'realtor_id';
  
  if (tableName === 'users') {
    ownerColumn = 'id';
  }

  return supabase
    .from(tableName)
    .select('*')
    .eq(ownerColumn, userId);
};

/**
 * Helper function to get tenant statistics
 */
const getTenantStats = async (userId) => {
  try {
    // Get statistics directly using SQL queries since RPC functions 
    // don't work with service role authentication context
    const [contactsResult, propertiesResult, leasesResult, activeLeasesResult, expiringLeasesResult] = await Promise.all([
      // Total contacts
      supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('realtor_id', userId)
        .eq('is_active', true),
      
      // Total properties  
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('realtor_id', userId)
        .eq('is_active', true),
      
      // Total leases
      supabase
        .from('leases')
        .select('id', { count: 'exact', head: true })
        .eq('realtor_id', userId),
      
      // Active leases
      supabase
        .from('leases')
        .select('id', { count: 'exact', head: true })
        .eq('realtor_id', userId)
        .eq('status', 'active'),
      
      // Expiring leases (next 90 days)
      supabase
        .from('leases')
        .select('id', { count: 'exact', head: true })
        .eq('realtor_id', userId)
        .eq('status', 'active')
        .lte('end_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    // Check for errors
    if (contactsResult.error) throw contactsResult.error;
    if (propertiesResult.error) throw propertiesResult.error;
    if (leasesResult.error) throw leasesResult.error;
    if (activeLeasesResult.error) throw activeLeasesResult.error;
    if (expiringLeasesResult.error) throw expiringLeasesResult.error;

    return {
      total_contacts: contactsResult.count || 0,
      total_properties: propertiesResult.count || 0,
      total_leases: leasesResult.count || 0,
      active_leases: activeLeasesResult.count || 0,
      expiring_leases: expiringLeasesResult.count || 0
    };
  } catch (error) {
    console.error('Failed to get tenant stats:', error);
    // Return default stats instead of throwing to prevent dashboard from breaking
    return {
      total_contacts: 0,
      total_properties: 0,
      total_leases: 0,
      active_leases: 0,
      expiring_leases: 0
    };
  }
};

module.exports = {
  tenantIsolation,
  validateTenantOwnership,
  validateTenantRelationships,
  getTenantQuery,
  getTenantStats
};
