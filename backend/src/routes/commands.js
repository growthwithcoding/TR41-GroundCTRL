/**
 * Command Routes (Stub)
 * Placeholder endpoints for future satellite command features
 */

const express = require('express');
const router = express.Router();
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

/**
 * POST /api/v1/commands/execute
 * Execute satellite command (stub - admin only)
 */
router.post('/execute', authMiddleware, requireAdmin, (req, res) => {
  const response = responseFactory.createErrorResponse(
    {
      statusCode: httpStatus.NOT_IMPLEMENTED,
      code: 'NOT_IMPLEMENTED',
      message: 'Command execution feature under development',
      details: 'This endpoint will be available in a future release'
    },
    {
      callSign: req.callSign || 'SYSTEM',
      requestId: req.id
    }
  );
  
  res.status(httpStatus.NOT_IMPLEMENTED).json(response);
});

/**
 * GET /api/v1/commands/history
 * Get command execution history (stub)
 */
router.get('/history', authMiddleware, (req, res) => {
  const response = responseFactory.createErrorResponse(
    {
      statusCode: httpStatus.NOT_IMPLEMENTED,
      code: 'NOT_IMPLEMENTED',
      message: 'Command history feature under development',
      details: 'This endpoint will be available in a future release'
    },
    {
      callSign: req.callSign || 'SYSTEM',
      requestId: req.id
    }
  );
  
  res.status(httpStatus.NOT_IMPLEMENTED).json(response);
});

module.exports = router;
