const express = require('express');
const {
  getLeases,
  getLease,
  createLease,
  updateLease,
  deleteLease,
  getExpiringLeases,
} = require('../controllers/leaseController');
const { protect } = require('../middleware/auth');
const { validateTenantOwnership, validateTenantRelationships, tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.route('/')
  .get(getLeases)
  .post(
    validateTenantRelationships({ 
      propertyId: 'property',
      tenantId: 'contact',
      landlordId: 'contact'
    }),
    createLease
  );

router.get('/expiring', getExpiringLeases);

router.route('/:id')
  .get(validateTenantOwnership('lease'), getLease)
  .put(
    validateTenantOwnership('lease'),
    validateTenantRelationships({ 
      propertyId: 'property',
      tenantId: 'contact',
      landlordId: 'contact'
    }),
    updateLease
  )
  .delete(validateTenantOwnership('lease'), deleteLease);

module.exports = router;
