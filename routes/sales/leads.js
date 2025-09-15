const express2 = require('express');
const router = express2.Router();
const leadController = require('../../controllers/sales/leads');
//const { validateBody } = require('../../middlewares/validate');
const Joi2 = require('joi');


const leadCreateSchema = Joi2.object({
firstName: Joi2.string().max(50).required(),
lastName: Joi2.string().max(50).allow('', null),
email: Joi2.string().email().required(),
phone: Joi2.string().allow('', null),
jobTitle: Joi2.string().max(100).allow('', null),
company: Joi2.object({ name: Joi2.string().max(200).required(), website: Joi2.string().uri().allow('', null), industry: Joi2.string().allow('', null), size: Joi2.string().allow('', null) }).required(),
source: Joi2.string().valid('web','referral','ads','event','cold_outreach','other').required(),
campaign: Joi2.string().allow('', null),
owner: Joi2.string().required()
});


router.post('/', leadController.createLead);
router.get('/', leadController.listLeads);
router.get('/:id', leadController.getLead);
router.put('/:id', leadController.updateLead);
router.patch('/:id/convert', leadController.convertLead);
router.delete('/:id', leadController.softDeleteLead);
router.post('/bulk/import', leadController.bulkImport);
router.put('/bulk', leadController.bulkUpdate);
router.post('/bulk/delete', leadController.bulkDelete);
router.get('/:id/insights', leadController.leadInsights);


module.exports = router;