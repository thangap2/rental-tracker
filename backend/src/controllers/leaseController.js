const leaseService = require('../services/leaseService');

// @desc    Get all leases
// @route   GET /api/leases
// @access  Private
const getLeases = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      propertyId,
      tenantId,
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (propertyId) filters.propertyId = propertyId;
    if (tenantId) filters.tenantId = tenantId;

    filters.limit = parseInt(limit);
    filters.offset = (parseInt(page) - 1) * parseInt(limit);

    const leases = await leaseService.findAll(req.user.id, filters);
    const total = await leaseService.count(req.user.id, filters);

    res.json({
      success: true,
      count: leases.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: leases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lease
// @route   GET /api/leases/:id
// @access  Private
const getLease = async (req, res, next) => {
  try {
    const lease = await leaseService.findById(req.params.id, req.user.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: 'Lease not found',
      });
    }

    res.json({
      success: true,
      data: lease,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new lease
// @route   POST /api/leases
// @access  Private
const createLease = async (req, res, next) => {
  try {
    const lease = await leaseService.create(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Lease created successfully',
      data: lease,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lease
// @route   PUT /api/leases/:id
// @access  Private
const updateLease = async (req, res, next) => {
  try {
    const lease = await leaseService.update(req.params.id, req.body, req.user.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: 'Lease not found',
      });
    }

    res.json({
      success: true,
      message: 'Lease updated successfully',
      data: lease,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lease
// @route   DELETE /api/leases/:id
// @access  Private
const deleteLease = async (req, res, next) => {
  try {
    const lease = await leaseService.delete(req.params.id, req.user.id);

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: 'Lease not found',
      });
    }

    res.json({
      success: true,
      message: 'Lease deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expiring leases
// @route   GET /api/leases/expiring
// @access  Private
const getExpiringLeases = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const leases = await leaseService.findExpiring(req.user.id, days);

    res.json({
      success: true,
      count: leases.length,
      data: leases,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeases,
  getLease,
  createLease,
  updateLease,
  deleteLease,
  getExpiringLeases,
};
