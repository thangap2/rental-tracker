const propertyService = require('../services/propertyService');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private
const getProperties = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      propertyType,
      city,
      isActive = 'true',
    } = req.query;

    const filters = {};

    if (search) filters.search = search;
    if (propertyType) filters.propertyType = propertyType;
    if (city) filters.city = city;
    if (isActive !== 'all') filters.isActive = isActive === 'true';

    filters.limit = parseInt(limit);
    filters.offset = (parseInt(page) - 1) * parseInt(limit);

    const properties = await propertyService.findAll(req.user.id, filters);
    const total = await propertyService.count(req.user.id, filters);

    res.json({
      success: true,
      count: properties.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Private
const getProperty = async (req, res, next) => {
  try {
    const property = await propertyService.findById(req.params.id, req.user.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private
const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.create(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
const updateProperty = async (req, res, next) => {
  try {
    const property = await propertyService.update(req.params.id, req.body, req.user.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = async (req, res, next) => {
  try {
    const property = await propertyService.delete(req.params.id, req.user.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
};
