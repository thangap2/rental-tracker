const express = require('express');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { validateContact, validateContactUpdate } = require('../middleware/validation');
const { validateTenantOwnership, tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.route('/')
  .get(getContacts)
  .post(validateContact, createContact);

router.route('/:id')
  .get(validateTenantOwnership('contact'), getContact)
  .put(validateTenantOwnership('contact'), validateContactUpdate, updateContact)
  .delete(validateTenantOwnership('contact'), deleteContact);

module.exports = router;
