const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  launchCampaign,
  pauseCampaign,
  completeCampaign,
  optimizeCampaignWithAI,
  updatePerformance,
  addChannel,
  updateChannelPerformance,
  getCampaignStatistics,
  getCampaignROI,
  deleteCampaign
} = require('../../controllers/marketing/campaignController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/marketing/campaigns
// @desc    Get all campaigns
// @access  Private
router.get('/', getAllCampaigns);

// @route   GET /api/v1/marketing/campaigns/stats
// @desc    Get campaign statistics
// @access  Private
router.get('/stats', getCampaignStatistics);

// @route   GET /api/v1/marketing/campaigns/:id/roi
// @desc    Get campaign ROI
// @access  Private
router.get('/:id/roi', getCampaignROI);

// @route   GET /api/v1/marketing/campaigns/:id
// @desc    Get single campaign
// @access  Private
router.get('/:id', getCampaign);

// @route   POST /api/v1/marketing/campaigns
// @desc    Create new campaign
// @access  Private
router.post('/', createCampaign);

// @route   PUT /api/v1/marketing/campaigns/:id
// @desc    Update campaign
// @access  Private
router.put('/:id', updateCampaign);

// @route   PUT /api/v1/marketing/campaigns/:id/launch
// @desc    Launch campaign
// @access  Private
router.put('/:id/launch', launchCampaign);

// @route   PUT /api/v1/marketing/campaigns/:id/pause
// @desc    Pause campaign
// @access  Private
router.put('/:id/pause', pauseCampaign);

// @route   PUT /api/v1/marketing/campaigns/:id/complete
// @desc    Complete campaign
// @access  Private
router.put('/:id/complete', completeCampaign);

// @route   POST /api/v1/marketing/campaigns/:id/optimize
// @desc    Optimize campaign with AI
// @access  Private
router.post('/:id/optimize', optimizeCampaignWithAI);

// @route   PUT /api/v1/marketing/campaigns/:id/performance
// @desc    Update campaign performance
// @access  Private
router.put('/:id/performance', updatePerformance);

// @route   POST /api/v1/marketing/campaigns/:id/channels
// @desc    Add channel to campaign
// @access  Private
router.post('/:id/channels', addChannel);

// @route   PUT /api/v1/marketing/campaigns/:id/channels/:channelId
// @desc    Update channel performance
// @access  Private
router.put('/:id/channels/:channelId', updateChannelPerformance);

// @route   DELETE /api/v1/marketing/campaigns/:id
// @desc    Delete campaign
// @access  Private
router.delete('/:id', deleteCampaign);

module.exports = router;
