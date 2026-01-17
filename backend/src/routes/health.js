/**
 * Health Check Route
 * Simple health check endpoint to verify API is operational
 */

const express = require('express');
const router = express.Router();
const responseFactory = require('../factories/responseFactory');
const missionControl = require('../config/missionControl');

/**
 * GET /api/v1/health
 * Health check endpoint
 * Public route - no authentication required
 */
router.get('/', (req, res) => {
  const healthData = {
    status: 'operational',
    service: 'GroundCTRL API',
    version: missionControl.version,
    station: missionControl.stationId,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  const response = responseFactory.createSuccessResponse(healthData, {
    callSign: 'SYSTEM',
    requestId: req.id,
    flatten: true  // Flatten the response so status is directly in payload
  });

  res.status(200).json(response);
});

/**
 * GET /api/v1/health/db
 * Database health check endpoint
 * Public route - no authentication required
 */
router.get('/db', async (req, res) => {
  try {
    // Check Firebase connection
    const admin = require('firebase-admin');
    const db = admin.firestore();
    
    // Simple connectivity test
    await db.collection('_health_check').limit(1).get();
    
    const dbHealthData = {
      status: 'connected',
      database: 'Firebase Firestore',
      service: 'GroundCTRL API',
      station: missionControl.stationId,
      timestamp: new Date().toISOString()
    };

    const response = responseFactory.createSuccessResponse(dbHealthData, {
      callSign: 'SYSTEM',
      requestId: req.id
    });

    res.status(200).json(response);
  } catch (error) {
    const errorData = {
      status: 'disconnected',
      database: 'Firebase Firestore',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    const response = responseFactory.createErrorResponse(
      'DATABASE_CONNECTION_ERROR',
      'Database health check failed',
      503,
      errorData,
      {
        callSign: 'SYSTEM',
        requestId: req.id
      }
    );

    res.status(503).json(response);
  }
});

module.exports = router;
