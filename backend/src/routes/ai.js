/**
 * AI Routes (Stub)
 * Placeholder endpoints for future AI features
 */

const express = require('express');
const router = express.Router();
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * POST /api/v1/ai/generate
 * AI generation endpoint (stub)
 */
router.post('/generate', authMiddleware, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'AI generation feature under development',
        details: 'This endpoint will be available in a future release'
      }
    },
    {
      callSign: req.callSign || 'SYSTEM',
      requestId: req.id
    }
  );
  
  res.status(httpStatus.NOT_IMPLEMENTED).json(response);
});

/**
 * POST /api/v1/ai/query
 * AI query endpoint (stub)
 */
router.post('/query', authMiddleware, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'AI query feature under development',
        details: 'This endpoint will be available in a future release'
      }
    },
    {
      callSign: req.callSign || 'SYSTEM',
      requestId: req.id
    }
  );
  
  res.status(httpStatus.NOT_IMPLEMENTED).json(response);
});

module.exports = router;
