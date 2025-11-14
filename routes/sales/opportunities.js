const express = require('express');
const {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  moveToStage,
  addLineItem,
  updateLineItem,
  removeLineItem,
  getPipelineMetrics,
  getWinRate,
  getForecast,
  cloneOpportunity
} = require('../../controllers/sales/opportunityController');

const { protect, authorize } = require('../../middleware/auth');
const {
  createOpportunityValidator,
  updateOpportunityValidator,
  idValidator,
} = require('../../validators/salesValidator');

const router = express.Router();

// Protect all routes
router.use(protect);

// Metrics routes (should be before /:id routes)
router.get('/metrics/pipeline', getPipelineMetrics);
router.get('/metrics/win-rate', getWinRate);
router.get('/metrics/forecast', getForecast);

// Main CRUD routes
router.route('/')
  .get(getOpportunities)
  .post(authorize('admin', 'sales'), createOpportunityValidator, createOpportunity);

router.route('/:id')
  .get(idValidator, getOpportunity)
  .put(authorize('admin', 'sales'), updateOpportunityValidator, updateOpportunity)
  .delete(authorize('admin', 'sales'), idValidator, deleteOpportunity);

// Stage management
router.put('/:id/stage', authorize('admin', 'sales'), moveToStage);

// Line items
router.post('/:id/line-items', authorize('admin', 'sales'), addLineItem);
router.put('/:id/line-items/:itemId', authorize('admin', 'sales'), updateLineItem);
router.delete('/:id/line-items/:itemId', authorize('admin', 'sales'), removeLineItem);

// Clone
router.post('/:id/clone', authorize('admin', 'sales'), cloneOpportunity);

module.exports = router;
