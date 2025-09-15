const ActivityModel = require('../../models/sales/activityModel');


exports.createActivity = (async (req,res) => {
const data = req.body;
if (!data.createdBy) return res.status(400).json({ success:false, message:'createdBy required' });
const act = await ActivityModel.create(data);
return res.status(201).json({ success:true, data: act });
});


exports.listActivities = (async (req,res) => {
const { page=1, limit=20, assignedTo, type, completed } = req.query;
const filter = {};
if (assignedTo) filter.assignedTo = assignedTo;
if (type) filter.type = type;
if (completed !== undefined) filter.isCompleted = completed === 'true';
const skip = (Number(page)-1)*Number(limit);
const [total, items] = await Promise.all([ActivityModel.countDocuments(filter), ActivityModel.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).lean()]);
return res.json({ success:true, total, page:Number(page), limit:Number(limit), data: items });
});


exports.getActivity = (async (req,res) => {
const act = await ActivityModel.findById(req.params.id).lean();
if (!act) return res.status(404).json({ success:false, message:'Activity not found' });
return res.json({ success:true, data: act });
});


exports.updateActivity = (async (req,res) => {
const act = await ActivityModel.findById(req.params.id);
if (!act) return res.status(404).json({ success:false, message:'Activity not found' });
Object.assign(act, req.body);
await act.save();
return res.json({ success:true, data: act });
});


exports.completeActivity = (async (req,res) => {
const act = await ActivityModel.findById(req.params.id);
if (!act) return res.status(404).json({ success:false, message:'Activity not found' });
act.isCompleted = true; act.outcome = req.body.outcome || 'success'; if (!act.completedDate) act.completedDate = new Date();
await act.save();
return res.json({ success:true, data: act });
});


exports.deleteActivity = (async (req,res) => {
const act = await ActivityModel.findByIdAndDelete(req.params.id);
if (!act) return res.status(404).json({ success:false, message:'Activity not found' });
return res.json({ success:true, message: 'Activity deleted' });
});