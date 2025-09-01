const express = require('express');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { protect } = require('../middleware/auth');
const { validateProperty, validatePropertyUpdate } = require('../middleware/validation');
const { validateTenantOwnership, validateTenantRelationships, tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.route('/')
  .get(getProperties)
  .post(
    validateTenantRelationships({ ownerId: 'contact' }),
    validateProperty, 
    createProperty
  );

router.route('/:id')
  .get(validateTenantOwnership('property'), getProperty)
  .put(
    validateTenantOwnership('property'),
    validateTenantRelationships({ ownerId: 'contact' }),
    validatePropertyUpdate, 
    updateProperty
  )
  .delete(validateTenantOwnership('property'), deleteProperty);

module.exports = router;
