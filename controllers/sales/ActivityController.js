const ActivityModel = require('../../models/sales/activityModel');

// Create Activity
exports.createActivity = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    if (!data.createdBy) {

      return res.status(400).json({ success: false, message: 'createdBy required' });
    }
    const act = await ActivityModel.create(data);
    return res.status(201).json({ success: true, data: act });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// List Activities with filters
exports.listActivities = async (req, res) => {
  const { page = 1, limit = 20, assignedTo, type, completed, lead } = req.query;
  const filter = {};
  if (assignedTo) filter.assignedTo = assignedTo;
  if (type) filter.type = type;
  if (lead) filter.lead = lead;
  if (completed !== undefined) filter.isCompleted = completed === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const [total, items] = await Promise.all([
    ActivityModel.countDocuments(filter),
    ActivityModel.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).lean()
  ]);
  return res.json({ success: true, total, page: Number(page), limit: Number(limit), data: items });
};

// Get Activity by ID
exports.getActivity = async (req, res) => {
  const act = await ActivityModel.findById(req.params.id).lean();
  if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
  return res.json({ success: true, data: act });
};

// Update Activity
exports.updateActivity = async (req, res) => {
  const act = await ActivityModel.findById(req.params.id);
  if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
  Object.assign(act, req.body);
  await act.save();
  return res.json({ success: true, data: act });
};

// Mark as Completed
exports.completeActivity = async (req, res) => {
  const act = await ActivityModel.findById(req.params.id);
  if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
  act.isCompleted = true;
  act.outcome = req.body.outcome || 'success';
  if (!act.completedDate) act.completedDate = new Date();
  await act.save();
  return res.json({ success: true, data: act });
};

// Delete Activity
exports.deleteActivity = async (req, res) => {
  const act = await ActivityModel.findByIdAndDelete(req.params.id);
  if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });
  return res.json({ success: true, message: 'Activity deleted' });
};

// Timeline for Lead
exports.timelineByLead = async (req, res) => {
  const { leadId } = req.params;
  const activities = await ActivityModel.find({ lead: leadId }).sort('scheduledDate').lean();
  return res.json({ success: true, data: activities });
};
