const express2 = require('express');
const router = express2.Router();
const leadController = require('../../controllers/sales/leads');
const {
  createLeadValidator,
  updateLeadValidator,
  idValidator,
} = require('../../validators/salesValidator');


router.post('/', createLeadValidator, leadController.createLead);
router.get('/', leadController.listLeads);
router.get('/:id', idValidator, leadController.getLead);
router.put('/:id', updateLeadValidator, leadController.updateLead);
router.patch('/:id/convert', idValidator, leadController.convertLead);
router.delete('/:id', idValidator, leadController.softDeleteLead);
router.post('/bulk/import', leadController.bulkImport);
router.put('/bulk', leadController.bulkUpdate);
router.post('/bulk/delete', leadController.bulkDelete);
router.get('/:id/insights', idValidator, leadController.leadInsights);


module.exports = router;