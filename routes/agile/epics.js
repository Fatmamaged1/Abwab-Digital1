const express = require('express');
const {
  getEpics,
  getEpic,
  createEpic,
  updateEpic,
  deleteEpic,
  updateProgress
} = require('../../controllers/agile/epicController');

const { protect, authorize } = require('../../middleware/auth');
const {
  createEpicValidator,
  updateEpicValidator,
  idValidator,
} = require('../../validators/agileValidator');

const router = express.Router();

// Protect all routes
router.use(protect);

// Main CRUD routes
router.route('/')
  .get(getEpics)
  .post(authorize('admin', 'manager', 'product_owner'), createEpicValidator, createEpic);

router.route('/:id')
  .get(idValidator, getEpic)
  .put(authorize('admin', 'manager', 'product_owner'), updateEpicValidator, updateEpic)
  .delete(authorize('admin', 'manager'), idValidator, deleteEpic);

// Progress
router.put('/:id/progress', updateProgress);

module.exports = router;
