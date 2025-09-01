const databaseExampleService = require('../services/databaseExampleService');
const { db } = require('../config/database');

class DatabaseExampleController {
  // Test both database connection methods
  async testConnections(req, res) {
    try {
      const results = {
        rest_available: true,
        direct_available: db.isDirectConnectionAvailable(),
        timestamp: new Date().toISOString()
      };

      // Test REST API
      try {
        const restUsers = await databaseExampleService.getUsersViaRest();
        results.rest_test = {
          success: true,
          user_count: restUsers.length
        };
      } catch (error) {
        results.rest_test = {
          success: false,
          error: error.message
        };
      }

      // Test direct connection if available
      if (results.direct_available) {
        try {
          const directUsers = await databaseExampleService.getUsersViaDirect();
          results.direct_test = {
            success: true,
            user_count: directUsers.length
          };
        } catch (error) {
          results.direct_test = {
            success: false,
            error: error.message
          };
        }
      } else {
        results.direct_test = {
          success: false,
          error: 'Direct connection not available'
        };
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error testing connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test database connections',
        error: error.message
      });
    }
  }

  // Get lease details using direct database connection
  async getLeaseWithJoins(req, res) {
    try {
      const { id } = req.params;
      
      const lease = await databaseExampleService.getLeaseDetailsWithJoins(id);
      
      if (!lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found'
        });
      }

      res.json({
        success: true,
        data: lease,
        method: db.isDirectConnectionAvailable() ? 'direct_sql' : 'rest_api'
      });
    } catch (error) {
      console.error('Error fetching lease with joins:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lease details',
        error: error.message
      });
    }
  }

  // Get analytics using direct SQL
  async getAnalytics(req, res) {
    try {
      if (!db.isDirectConnectionAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Analytics require direct database connection. Please configure database credentials.'
        });
      }

      const analytics = await databaseExampleService.getLeaseAnalytics();
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  // Execute custom SQL query (for development/admin use)
  async executeQuery(req, res) {
    try {
      if (!db.isDirectConnectionAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Direct database connection not available'
        });
      }

      const { query, params = [] } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      // Basic security check - only allow SELECT queries in production
      if (process.env.NODE_ENV === 'production' && !query.trim().toLowerCase().startsWith('select')) {
        return res.status(403).json({
          success: false,
          message: 'Only SELECT queries are allowed in production'
        });
      }

      const result = await db.query(query, params);
      
      res.json({
        success: true,
        data: {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID }))
        }
      });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute query',
        error: error.message
      });
    }
  }

  // Get table schema information
  async getTableInfo(req, res) {
    try {
      if (!db.isDirectConnectionAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Direct database connection not available'
        });
      }

      const { tableName } = req.params;
      
      const columns = await db.getTableInfo(tableName);
      
      if (columns.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Table not found or no access'
        });
      }

      res.json({
        success: true,
        data: {
          table: tableName,
          columns: columns
        }
      });
    } catch (error) {
      console.error('Error fetching table info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table information',
        error: error.message
      });
    }
  }

  // Compare performance between REST and direct connection
  async performanceTest(req, res) {
    try {
      const results = {};

      // Test REST API performance
      const restStart = Date.now();
      try {
        await databaseExampleService.getUsersViaRest();
        results.rest_time = Date.now() - restStart;
        results.rest_success = true;
      } catch (error) {
        results.rest_time = Date.now() - restStart;
        results.rest_success = false;
        results.rest_error = error.message;
      }

      // Test direct connection performance (if available)
      if (db.isDirectConnectionAvailable()) {
        const directStart = Date.now();
        try {
          await databaseExampleService.getUsersViaDirect();
          results.direct_time = Date.now() - directStart;
          results.direct_success = true;
        } catch (error) {
          results.direct_time = Date.now() - directStart;
          results.direct_success = false;
          results.direct_error = error.message;
        }

        if (results.rest_success && results.direct_success) {
          results.performance_difference = `Direct connection is ${
            results.rest_time > results.direct_time 
              ? (results.rest_time / results.direct_time).toFixed(2) + 'x faster'
              : (results.direct_time / results.rest_time).toFixed(2) + 'x slower'
          }`;
        }
      } else {
        results.direct_available = false;
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error in performance test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run performance test',
        error: error.message
      });
    }
  }
}

module.exports = new DatabaseExampleController();
