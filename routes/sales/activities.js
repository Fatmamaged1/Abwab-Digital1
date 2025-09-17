const express3 = require('express');
const router = express3.Router();
const activityController = require('../../controllers/sales/ActivityController');


router.post('/', activityController.createActivity);
router.get('/', activityController.listActivities);
router.get('/timeline/:leadId', activityController.timelineByLead);
router.get('/:id', activityController.getActivity);
router.put('/:id', activityController.updateActivity);
router.patch('/:id/complete', activityController.completeActivity);
router.delete('/:id', activityController.deleteActivity);


module.exports = router;