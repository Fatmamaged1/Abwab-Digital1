// routes/sales/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../../controllers/sales/ActivityController');
const upload = require('../../middleware/upload');
const {
  createActivityValidator,
  updateActivityValidator,
  idValidator,
} = require('../../validators/salesValidator');

router.post(
  '/',
  upload.fields([{ name: "attachments", maxCount: 5 }]),
  createActivityValidator,
  activityController.createActivity
);

router.get('/', activityController.listActivities);
router.get('/timeline/:leadId', activityController.timelineByLead);
router.get('/:id', idValidator, activityController.getActivity);
router.put('/:id', updateActivityValidator, activityController.updateActivity);
router.patch('/:id/complete', idValidator, activityController.completeActivity);
router.delete('/:id', idValidator, activityController.deleteActivity);

module.exports = router;
