const express = require('express');
const router = express.Router();
const {
  getAllProposals,
  getProposal,
  createProposal,
  generateProposalWithAI,
  updateProposal,
  approveProposal,
  sendProposal,
  acceptProposal,
  rejectProposal,
  getProposalStatistics,
  exportProposal,
  deleteProposal
} = require('../../controllers/sales/proposalGeneratorController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/sales/proposals
// @desc    Get all proposals
// @access  Private
router.get('/', getAllProposals);

// @route   GET /api/v1/sales/proposals/stats
// @desc    Get proposal statistics
// @access  Private
router.get('/stats', getProposalStatistics);

// @route   POST /api/v1/sales/proposals/generate
// @desc    Generate proposal with AI
// @access  Private
router.post('/generate', generateProposalWithAI);

// @route   GET /api/v1/sales/proposals/:id
// @desc    Get single proposal
// @access  Private
router.get('/:id', getProposal);

// @route   POST /api/v1/sales/proposals
// @desc    Create proposal
// @access  Private
router.post('/', createProposal);

// @route   PUT /api/v1/sales/proposals/:id
// @desc    Update proposal
// @access  Private
router.put('/:id', updateProposal);

// @route   PUT /api/v1/sales/proposals/:id/approve
// @desc    Approve proposal
// @access  Private
router.put('/:id/approve', approveProposal);

// @route   PUT /api/v1/sales/proposals/:id/send
// @desc    Send proposal to client
// @access  Private
router.put('/:id/send', sendProposal);

// @route   PUT /api/v1/sales/proposals/:id/accept
// @desc    Mark proposal as accepted
// @access  Private
router.put('/:id/accept', acceptProposal);

// @route   PUT /api/v1/sales/proposals/:id/reject
// @desc    Mark proposal as rejected
// @access  Private
router.put('/:id/reject', rejectProposal);

// @route   GET /api/v1/sales/proposals/:id/export
// @desc    Export proposal as PDF
// @access  Private
router.get('/:id/export', exportProposal);

// @route   DELETE /api/v1/sales/proposals/:id
// @desc    Delete proposal (soft delete)
// @access  Private
router.delete('/:id', deleteProposal);

module.exports = router;
