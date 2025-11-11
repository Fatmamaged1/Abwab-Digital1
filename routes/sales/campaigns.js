const express = require('express');
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addRecipients,
  removeRecipient,
  updateCampaignStatus,
  updateRecipientStatus,
  markConverted,
  getCampaignMetrics,
  getActiveCampaigns,
  getCampaignStats,
  cloneCampaign,
  addSequenceStep,
  updateSequenceStep,
  deleteSequenceStep
} = require('../../controllers/sales/outreachCampaignController');

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (should be before /:id routes)
router.get('/active', getActiveCampaigns);
router.get('/stats', getCampaignStats);

// Main CRUD routes
router.route('/')
  .get(getCampaigns)
  .post(authorize('admin', 'sales', 'marketing'), createCampaign);

router.route('/:id')
  .get(getCampaign)
  .put(authorize('admin', 'sales', 'marketing'), updateCampaign)
  .delete(authorize('admin', 'sales', 'marketing'), deleteCampaign);

// Recipients management
router.post('/:id/recipients', authorize('admin', 'sales', 'marketing'), addRecipients);
router.delete('/:id/recipients/:leadId', authorize('admin', 'sales', 'marketing'), removeRecipient);
router.put('/:id/recipients/:leadId/status', updateRecipientStatus);
router.put('/:id/recipients/:leadId/convert', markConverted);

// Campaign status
router.put('/:id/status', authorize('admin', 'sales', 'marketing'), updateCampaignStatus);

// Metrics
router.get('/:id/metrics', getCampaignMetrics);

// Clone
router.post('/:id/clone', authorize('admin', 'sales', 'marketing'), cloneCampaign);

// Sequence management
router.post('/:id/sequence', authorize('admin', 'sales', 'marketing'), addSequenceStep);
router.put('/:id/sequence/:stepId', authorize('admin', 'sales', 'marketing'), updateSequenceStep);
router.delete('/:id/sequence/:stepId', authorize('admin', 'sales', 'marketing'), deleteSequenceStep);

module.exports = router;
