const express = require('express');
const {
  getHandbookEntries,
  getHandbookEntry,
  createHandbookEntry,
  updateHandbookEntry,
  deleteHandbookEntry,
  publishEntry,
  archiveEntry,
  toggleLike,
  toggleBookmark,
  addReview,
  getPopularEntries,
  getTopRatedEntries,
  searchEntries,
  getMyBookmarks,
  getHandbookStats
} = require('../../controllers/sales/salesHandbookController');

const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (should be before /:id routes)
router.get('/popular', getPopularEntries);
router.get('/top-rated', getTopRatedEntries);
router.get('/search', searchEntries);
router.get('/my-bookmarks', getMyBookmarks);
router.get('/stats', getHandbookStats);

// Main CRUD routes
router.route('/')
  .get(getHandbookEntries)
  .post(authorize('admin', 'sales', 'manager'), createHandbookEntry);

router.route('/:id')
  .get(getHandbookEntry)
  .put(authorize('admin', 'sales', 'manager'), updateHandbookEntry)
  .delete(authorize('admin', 'sales', 'manager'), deleteHandbookEntry);

// Publishing
router.put('/:id/publish', authorize('admin', 'sales', 'manager'), publishEntry);
router.put('/:id/archive', authorize('admin', 'sales', 'manager'), archiveEntry);

// Engagement
router.put('/:id/like', toggleLike);
router.put('/:id/bookmark', toggleBookmark);

// Reviews
router.post('/:id/reviews', addReview);

module.exports = router;
