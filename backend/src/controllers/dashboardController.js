const leaseService = require('../services/leaseService');
const contactService = require('../services/contactService');
const propertyService = require('../services/propertyService');
const { getTenantStats } = require('../middleware/tenantIsolation');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const realtorId = req.user.id;

    // Get tenant statistics using the database function for better performance
    const tenantStats = await getTenantStats(realtorId);
    
    // Get expiring leases for different time periods
    const expiringIn30Days = await leaseService.findExpiring(realtorId, 30);
    const expiringIn60Days = await leaseService.findExpiring(realtorId, 60);
    const expiringIn100Days = await leaseService.findExpiring(realtorId, 100);

    // Get recent leases
    const recentLeases = await leaseService.findRecent(realtorId, 5);

    res.json({
      success: true,
      data: {
        overview: {
          totalContacts: tenantStats.total_contacts,
          totalProperties: tenantStats.total_properties,
          totalLeases: tenantStats.total_leases,
          activeLeases: tenantStats.active_leases,
          expiringLeases: tenantStats.expiring_leases,
        },
        expiringLeases: {
          in30Days: {
            count: expiringIn30Days.length,
            leases: expiringIn30Days,
          },
          in60Days: {
            count: expiringIn60Days.length,
            leases: expiringIn60Days,
          },
          in100Days: {
            count: expiringIn100Days.length,
            leases: expiringIn100Days,
          },
        },
        recentLeases,
        tenantId: realtorId, // Include tenant ID for debugging/admin purposes
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
