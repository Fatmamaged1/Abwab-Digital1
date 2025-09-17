const Lead = require('../../models/sales/leadModel');



exports.createLead = async (req,res) => {
    try {
      const lead = await Lead.create(req.body);
      return res.status(201).json({ success:true, data:lead });
    } catch (e) {
      return res.status(400).json({ success:false, message:e.message });
    }
  };
  // جلب كل الـ Leads (غير المحذوفة)
  exports.listLeads = async (req, res) => {
    try {
      const leads = await Lead.find({ isDeleted: false }); // Array
      return res.json({ success: true, data: leads });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
  
  
  exports.getLead = async (req,res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead || lead.isDeleted) return res.status(404).json({ success:false, message:'Lead not found' });
    return res.json({ success:true, data:lead });
  };
  
  exports.updateLead = async (req,res) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (!lead) return res.status(404).json({ success:false, message:'Lead not found' });
    return res.json({ success:true, data:lead });
  };
  
  exports.convertLead = async (req,res) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success:false, message:'Lead not found' });
  
    lead.conversion = lead.conversion || { history:[] };
    lead.conversion.conversionOwner = req.body.conversionOwner || lead.owner;
    lead.conversion.history.push({ stage:'converted', date:new Date(), notes:req.body.notes || 'Converted' });
    lead.status = 'converted';
    await lead.save();
  
    return res.json({ success:true, message:'Lead converted', data:lead });
  };
  

exports.softDeleteLead = (async (req,res) => {
const lead = await Lead.findById(req.params.id);
if (!lead) return res.status(404).json({ success:false, message:'Lead not found' });
lead.isDeleted = true;
await lead.save();
return res.json({ success:true, message:'Lead soft-deleted' });
});


// Bulk import CSV/JSON (simple implementation)
exports.bulkImport = (async (req,res) => {
// Expect: multipart with file or JSON body { items: [] }
if (req.is('application/json') && Array.isArray(req.body.items)){
const items = req.body.items;
const results = { created:0, updated:0, errors:[] };
for (const it of items){
try{
const existing = await Lead.findOne({ email: it.email });
if (existing) { Object.assign(existing, it); await existing.save(); results.updated++; }
else { await Lead.create(it); results.created++; }
} catch(e){ results.errors.push({ item: it.email || '(no-email)', error: e.message }); }
}
return res.json({ success:true, results });
}
// CSV file handling would be implemented with multer + csvtojson
return res.status(400).json({ success:false, message:'Send JSON { items: [...] } for now' });
});


exports.bulkUpdate = (async (req,res) => {
// body: { ids: [], update: { owner, status, pipelineStage } }
const { ids, update } = req.body;
if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success:false, message:'ids required' });
const r = await Lead.updateMany({ _id: { $in: ids } }, { $set: update });
return res.json({ success:true, modifiedCount: r.nModified || r.modifiedCount });
});


exports.bulkDelete = (async (req,res) => {
const { ids } = req.body;
if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success:false, message:'ids required' });
const r = await Lead.updateMany({ _id: { $in: ids } }, { $set: { isDeleted: true } });
return res.json({ success:true, modifiedCount: r.nModified || r.modifiedCount });
});


exports.leadInsights = (async (req,res) => {
// Simple insights: hot leads count, avg score, top sources
const filter = { isDeleted: false };
const hotCount = await Lead.countDocuments({ ...filter, priority: 'hot' });
const avgScoreAgg = await Lead.aggregate([{ $match: filter }, { $group: { _id: null, avgScore: { $avg: '$bant.overallScore' } } }]);
const avgScore = avgScoreAgg[0] ? Math.round(avgScoreAgg[0].avgScore) : 0;
const topSources = await Lead.aggregate([{ $match: filter }, { $group: { _id: '$source', count: { $sum:1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]);
return res.json({ success:true, data: { hotCount, avgScore, topSources } });
});