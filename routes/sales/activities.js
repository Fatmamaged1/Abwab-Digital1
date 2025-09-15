const express3 = require('express');
const routerActivities = express3.Router();
const activityController = require('../../controllers/sales/ActivityController');


routerActivities.post('/', activityController.createActivity);
routerActivities.get('/', activityController.listActivities);
routerActivities.get('/:id', activityController.getActivity);
routerActivities.put('/:id', activityController.updateActivity);
routerActivities.patch('/:id/complete', activityController.completeActivity);
routerActivities.delete('/:id', activityController.deleteActivity);


module.exports = routerActivities;