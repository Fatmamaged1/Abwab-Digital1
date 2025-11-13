const express = require('express');
const router = express.Router();
const {
  getAllBugs,
  getBug,
  createBug,
  updateBug,
  assignBug,
  updateBugStatus,
  categorizeBugWithAI,
  addComment,
  attachFile,
  linkRelatedBug,
  getBugStatistics,
  getSLAReport,
  getBugsByProject,
  deleteBug
} = require('../../controllers/software/bugTrackerController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/software/bugs
// @desc    Get all bugs with filters
// @access  Private
router.get('/', getAllBugs);

// @route   GET /api/v1/software/bugs/stats
// @desc    Get bug statistics
// @access  Private
router.get('/stats', getBugStatistics);

// @route   GET /api/v1/software/bugs/sla-report
// @desc    Get SLA compliance report
// @access  Private
router.get('/sla-report', getSLAReport);

// @route   GET /api/v1/software/bugs/project/:projectId
// @desc    Get bugs by project
// @access  Private
router.get('/project/:projectId', getBugsByProject);

// @route   GET /api/v1/software/bugs/:id
// @desc    Get single bug
// @access  Private
router.get('/:id', getBug);

// @route   POST /api/v1/software/bugs
// @desc    Create new bug
// @access  Private
router.post('/', createBug);

// @route   PUT /api/v1/software/bugs/:id
// @desc    Update bug
// @access  Private
router.put('/:id', updateBug);

// @route   PUT /api/v1/software/bugs/:id/assign
// @desc    Assign bug to developer
// @access  Private
router.put('/:id/assign', assignBug);

// @route   PUT /api/v1/software/bugs/:id/status
// @desc    Update bug status
// @access  Private
router.put('/:id/status', updateBugStatus);

// @route   POST /api/v1/software/bugs/:id/categorize
// @desc    Categorize bug with AI
// @access  Private
router.post('/:id/categorize', categorizeBugWithAI);

// @route   POST /api/v1/software/bugs/:id/comments
// @desc    Add comment to bug
// @access  Private
router.post('/:id/comments', addComment);

// @route   POST /api/v1/software/bugs/:id/attachments
// @desc    Attach file to bug
// @access  Private
router.post('/:id/attachments', attachFile);

// @route   POST /api/v1/software/bugs/:id/related
// @desc    Link related bug
// @access  Private
router.post('/:id/related', linkRelatedBug);

// @route   DELETE /api/v1/software/bugs/:id
// @desc    Delete bug
// @access  Private
router.delete('/:id', deleteBug);

module.exports = router;
