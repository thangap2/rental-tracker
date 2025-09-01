const express = require('express');
const router = express.Router();
const databaseExampleController = require('../controllers/databaseExampleController');
const { protect, authorize } = require('../middleware/auth');

// Test database connections
router.get('/test-connections', protect, databaseExampleController.testConnections);

// Get lease with joins (demonstrates complex query)
router.get('/leases/:id/detailed', protect, databaseExampleController.getLeaseWithJoins);

// Get analytics (requires direct connection)
router.get('/analytics', protect, authorize('admin', 'realtor'), databaseExampleController.getAnalytics);

// Get table schema information
router.get('/table-info/:tableName', protect, authorize('admin'), databaseExampleController.getTableInfo);

// Execute custom SQL query (admin only, development)
router.post('/execute-query', protect, authorize('admin'), databaseExampleController.executeQuery);

// Performance comparison test
router.get('/performance-test', protect, databaseExampleController.performanceTest);

module.exports = router;
