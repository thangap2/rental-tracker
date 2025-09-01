const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

// All email routes require authentication
router.use(protect);

// Send custom emails to multiple recipients
router.post('/send', emailController.sendEmails);

// Send emails to specific contacts
router.post('/send-to-contacts', emailController.sendToContacts);

// Send lease reminder with optional custom message
router.post('/send-lease-reminder', emailController.sendLeaseReminder);

// Get email history
router.get('/history', emailController.getEmailHistory);

module.exports = router;
