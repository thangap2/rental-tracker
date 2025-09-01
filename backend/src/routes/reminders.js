const express = require('express');
const router = express.Router();
const leaseReminderController = require('../controllers/leaseReminderController');
const { protect } = require('../middleware/auth');

// Protect all reminder routes with authentication
router.use(protect);

// POST /api/reminders/check - Run reminder check (typically called by cron job)
router.post('/check', leaseReminderController.runReminderCheck);

// GET /api/reminders/expiring - Get leases expiring in the next X days
router.get('/expiring', leaseReminderController.getExpiringLeases);

// GET /api/reminders/stats - Get reminder statistics
router.get('/stats', leaseReminderController.getReminderStats);

// GET /api/reminders/lease/:leaseId/history - Get reminder history for a specific lease
router.get('/lease/:leaseId/history', leaseReminderController.getReminderHistory);

// POST /api/reminders/lease/:leaseId/manual - Manually trigger a reminder
router.post('/lease/:leaseId/manual', leaseReminderController.manualReminder);

module.exports = router;
