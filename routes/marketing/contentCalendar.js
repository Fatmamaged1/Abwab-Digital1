const express = require('express');
const router = express.Router();
const {
  getAllCalendars,
  getCalendar,
  getCalendarByPeriod,
  createCalendar,
  updateCalendar,
  addEntry,
  updateEntry,
  deleteEntry,
  scheduleEntry,
  publishEntry,
  updateEntryMetrics,
  syncWithClient,
  getCalendarStatistics,
  getUpcomingEntries,
  deleteCalendar
} = require('../../controllers/marketing/contentCalendarController');

const { protect } = require('../../middleware/auth');

router.use(protect);

// @route   GET /api/v1/marketing/content-calendar
// @desc    Get all content calendars
// @access  Private
router.get('/', getAllCalendars);

// @route   GET /api/v1/marketing/content-calendar/stats
// @desc    Get content calendar statistics
// @access  Private
router.get('/stats', getCalendarStatistics);

// @route   GET /api/v1/marketing/content-calendar/upcoming
// @desc    Get upcoming entries
// @access  Private
router.get('/upcoming', getUpcomingEntries);

// @route   GET /api/v1/marketing/content-calendar/period/:year/:month
// @desc    Get calendar by period
// @access  Private
router.get('/period/:year/:month', getCalendarByPeriod);

// @route   GET /api/v1/marketing/content-calendar/:id
// @desc    Get single calendar
// @access  Private
router.get('/:id', getCalendar);

// @route   POST /api/v1/marketing/content-calendar
// @desc    Create new content calendar
// @access  Private
router.post('/', createCalendar);

// @route   PUT /api/v1/marketing/content-calendar/:id
// @desc    Update content calendar
// @access  Private
router.put('/:id', updateCalendar);

// @route   POST /api/v1/marketing/content-calendar/:id/entries
// @desc    Add entry to calendar
// @access  Private
router.post('/:id/entries', addEntry);

// @route   PUT /api/v1/marketing/content-calendar/:id/entries/:entryId
// @desc    Update calendar entry
// @access  Private
router.put('/:id/entries/:entryId', updateEntry);

// @route   DELETE /api/v1/marketing/content-calendar/:id/entries/:entryId
// @desc    Delete calendar entry
// @access  Private
router.delete('/:id/entries/:entryId', deleteEntry);

// @route   PUT /api/v1/marketing/content-calendar/:id/entries/:entryId/schedule
// @desc    Schedule entry
// @access  Private
router.put('/:id/entries/:entryId/schedule', scheduleEntry);

// @route   PUT /api/v1/marketing/content-calendar/:id/entries/:entryId/publish
// @desc    Mark entry as published
// @access  Private
router.put('/:id/entries/:entryId/publish', publishEntry);

// @route   PUT /api/v1/marketing/content-calendar/:id/entries/:entryId/metrics
// @desc    Update entry metrics
// @access  Private
router.put('/:id/entries/:entryId/metrics', updateEntryMetrics);

// @route   POST /api/v1/marketing/content-calendar/:id/sync
// @desc    Sync calendar with client
// @access  Private
router.post('/:id/sync', syncWithClient);

// @route   DELETE /api/v1/marketing/content-calendar/:id
// @desc    Delete content calendar
// @access  Private
router.delete('/:id', deleteCalendar);

module.exports = router;
