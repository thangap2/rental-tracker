const { body, validationResult } = require('express-validator');

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Contact validation rules
const validateContact = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot be more than 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot be more than 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('alternatePhone')
    .optional()
    .trim(),
  
  body('contactType')
    .optional()
    .isIn(['tenant', 'landlord', 'both'])
    .withMessage('Contact type must be tenant, landlord, or both'),
  
  body('preferredContactMethod')
    .optional()
    .isIn(['email', 'phone', 'text'])
    .withMessage('Preferred contact method must be email, phone, or text'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  // Address validation
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('address.country').optional().trim(),
  
  // Emergency contact validation
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relationship').optional().trim(),
  
  handleValidationErrors,
];

const validateContactUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot be more than 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot be more than 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty'),
  
  body('alternatePhone')
    .optional()
    .trim(),
  
  body('contactType')
    .optional()
    .isIn(['tenant', 'landlord', 'both'])
    .withMessage('Contact type must be tenant, landlord, or both'),
  
  body('preferredContactMethod')
    .optional()
    .isIn(['email', 'phone', 'text'])
    .withMessage('Preferred contact method must be email, phone, or text'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  // Address validation
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('address.country').optional().trim(),
  
  // Emergency contact validation
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.phone').optional().trim(),
  body('emergencyContact.relationship').optional().trim(),
  
  handleValidationErrors,
];

// Property validation rules
const validateProperty = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Property title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),
  
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),
  
  body('address.country')
    .optional()
    .trim(),
  
  body('propertyType')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'duplex', 'studio', 'other'])
    .withMessage('Invalid property type'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bedrooms must be between 0 and 20'),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0, max: 20 })
    .withMessage('Bathrooms must be between 0 and 20'),
  
  body('squareFootage')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Square footage must be a positive number');
        }
      }
      return true;
    }),
  
  body('yearBuilt')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(numValue) || numValue < 1800 || numValue > currentYear + 1) {
          throw new Error(`Year built must be between 1800 and ${currentYear + 1}`);
        }
      }
      return true;
    }),
  
  body('parkingSpaces')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Parking spaces must be a positive number'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot be more than 2000 characters'),
  
  body('owner')
    .notEmpty()
    .withMessage('Property owner is required')
    .isUUID()
    .withMessage('Invalid owner ID'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('petPolicy.allowed')
    .optional()
    .isBoolean()
    .withMessage('Pet allowed must be a boolean'),
  
  body('petPolicy.deposit')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      // Only validate deposit if pets are allowed and a value is provided
      if (req.body.petPolicy?.allowed && value !== null && value !== undefined && value !== '') {
        if (isNaN(value) || parseFloat(value) < 0) {
          throw new Error('Pet deposit must be a positive number');
        }
      }
      return true;
    }),
  
  body('utilities.included')
    .optional()
    .isArray()
    .withMessage('Utilities included must be an array'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors,
];

const validatePropertyUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Property title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),
  
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
  
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  
  body('address.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('ZIP code cannot be empty'),
  
  body('address.country')
    .optional()
    .trim(),
  
  body('propertyType')
    .optional()
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'duplex', 'studio', 'other'])
    .withMessage('Invalid property type'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bedrooms must be between 0 and 20'),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0, max: 20 })
    .withMessage('Bathrooms must be between 0 and 20'),
  
  body('squareFootage')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Square footage must be a positive number');
        }
      }
      return true;
    }),
  
  body('yearBuilt')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(numValue) || numValue < 1800 || numValue > currentYear + 1) {
          throw new Error(`Year built must be between 1800 and ${currentYear + 1}`);
        }
      }
      return true;
    }),
  
  body('parkingSpaces')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Parking spaces must be a positive number'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot be more than 2000 characters'),
  
  body('owner')
    .optional()
    .isUUID()
    .withMessage('Invalid owner ID'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('petPolicy.allowed')
    .optional()
    .isBoolean()
    .withMessage('Pet allowed must be a boolean'),
  
  body('petPolicy.deposit')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      // Only validate deposit if pets are allowed and a value is provided
      if (req.body.petPolicy?.allowed && value !== null && value !== undefined && value !== '') {
        if (isNaN(value) || parseFloat(value) < 0) {
          throw new Error('Pet deposit must be a positive number');
        }
      }
      return true;
    }),
  
  body('utilities.included')
    .optional()
    .isArray()
    .withMessage('Utilities included must be an array'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors,
];

module.exports = {
  validateContact,
  validateContactUpdate,
  validateProperty,
  validatePropertyUpdate,
  handleValidationErrors,
};