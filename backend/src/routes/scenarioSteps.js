/**
 * Scenario Step Routes
 * 
 * CRUD endpoints for scenario steps
 */

const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const controller = require('../controllers/scenarioStepController');
const {
  createScenarioStepSchema,
  updateScenarioStepSchema,
  patchScenarioStepSchema,
  listScenarioStepsSchema
} = require('../schemas/scenarioStepSchemas');
const { z } = require('zod');

router.use(authMiddleware);

router.get(
  '/',
  validate(z.object({
    body: z.object({}).strict(),
    query: listScenarioStepsSchema.shape.query,
    params: z.object({}).strict()
  })),
  controller.list
);

router.post(
  '/',
  validate(z.object({
    body: createScenarioStepSchema.shape.body,
    query: z.object({}).strict(),
    params: z.object({}).strict()
  })),
  controller.create
);

router.get(
  '/:id',
  validate(z.object({
    body: z.object({}).strict(),
    query: z.object({}).strict(),
    params: z.object({
      id: z.string().min(1, 'Step ID is required')
    }).strict()
  })),
  controller.getOne
);

router.put(
  '/:id',
  validate(z.object({
    body: updateScenarioStepSchema.shape.body,
    query: z.object({}).strict(),
    params: updateScenarioStepSchema.shape.params
  })),
  controller.update
);

router.patch(
  '/:id',
  validate(z.object({
    body: patchScenarioStepSchema.shape.body,
    query: z.object({}).strict(),
    params: patchScenarioStepSchema.shape.params
  })),
  controller.patch
);

router.delete(
  '/:id',
  controller.remove
);

module.exports = router;