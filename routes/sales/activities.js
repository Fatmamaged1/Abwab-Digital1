// routes/sales/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../../controllers/sales/ActivityController');
const upload = require('../../middleware/upload');

// ✅ يدعم form-data مع مرفقات
router.post(
  '/',
  upload.fields([{ name: "attachments", maxCount: 5 }]),
  activityController.createActivity
);

router.get('/', activityController.listActivities);
router.get('/timeline/:leadId', activityController.timelineByLead);
router.get('/:id', activityController.getActivity);
router.put('/:id', activityController.updateActivity);
router.patch('/:id/complete', activityController.completeActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
