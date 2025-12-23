/**
 * Satellite Routes (Stub)
 * Placeholder endpoints for future satellite management
 */

const express = require('express');
const router = express.Router();
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

/**
 * GET /api/v1/satellites
 * List all satellites (stub)
 */
router.get('/', authMiddleware, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Satellite listing feature under development',
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
 * GET /api/v1/satellites/:id
 * Get satellite by ID (stub)
 */
router.get('/:id', authMiddleware, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Satellite details feature under development',
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
 * POST /api/v1/satellites
 * Create new satellite (stub - admin only)
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Satellite creation feature under development',
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
 * PUT /api/v1/satellites/:id
 * Update satellite (stub - admin only)
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Satellite update feature under development',
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
 * DELETE /api/v1/satellites/:id
 * Delete satellite (stub - admin only)
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  const response = responseFactory.createResponse(
    'HOLD',
    httpStatus.NOT_IMPLEMENTED,
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Satellite deletion feature under development',
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
