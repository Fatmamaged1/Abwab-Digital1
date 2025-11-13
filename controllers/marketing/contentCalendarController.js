const ContentCalendar = require('../../models/marketing/contentCalendarModel');
const AIService = require('../../services/aiService');

// @desc    Get all content calendars
// @route   GET /api/v1/marketing/content-calendars
// @access  Private
exports.getAllCalendars = async (req, res) => {
  try {
    const { campaign, client, month, year, page = 1, limit = 20 } = req.query;
    const query = {};

    if (campaign) query.campaign = campaign;
    if (client) query.client = client;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const calendars = await ContentCalendar.find(query)
      .populate('campaign', 'name type')
      .populate('client', 'name')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ContentCalendar.countDocuments(query);

    res.status(200).json({
      success: true,
      data: calendars,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content calendars',
      error: error.message
    });
  }
};

// @desc    Get single content calendar
// @route   GET /api/v1/marketing/content-calendars/:id
// @access  Private
exports.getCalendar = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id)
      .populate('campaign', 'name type status')
      .populate('client', 'name email phone');

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content calendar',
      error: error.message
    });
  }
};

// @desc    Get calendar by month/year
// @route   GET /api/v1/marketing/content-calendars/month/:year/:month
// @access  Private
exports.getCalendarByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { campaign, client } = req.query;

    const query = {
      year: parseInt(year),
      month: parseInt(month)
    };

    if (campaign) query.campaign = campaign;
    if (client) query.client = client;

    const calendar = await ContentCalendar.findOne(query)
      .populate('campaign', 'name type')
      .populate('client', 'name');

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found for this period'
      });
    }

    res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content calendar',
      error: error.message
    });
  }
};

// @desc    Create or update content calendar
// @route   POST /api/v1/marketing/content-calendars
// @access  Private
exports.createOrUpdateCalendar = async (req, res) => {
  try {
    const { campaign, client, month, year, entries } = req.body;

    let calendar = await ContentCalendar.findOne({
      campaign,
      client,
      month,
      year
    });

    if (calendar) {
      // Update existing
      calendar.entries = entries || calendar.entries;
      await calendar.save();

      return res.status(200).json({
        success: true,
        data: calendar,
        message: 'Content calendar updated successfully'
      });
    }

    // Create new
    calendar = await ContentCalendar.create({
      campaign,
      client,
      month,
      year,
      entries: entries || []
    });

    res.status(201).json({
      success: true,
      data: calendar,
      message: 'Content calendar created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating/updating content calendar',
      error: error.message
    });
  }
};

// @desc    Add entry to calendar
// @route   POST /api/v1/marketing/content-calendars/:id/entries
// @access  Private
exports.addEntry = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entry = {
      date: req.body.date,
      time: req.body.time,
      platform: req.body.platform,
      contentType: req.body.contentType,
      title: req.body.title,
      caption: req.body.caption,
      hashtags: req.body.hashtags || [],
      media: req.body.media || [],
      status: req.body.status || 'draft',
      aiGenerated: req.body.aiGenerated || false
    };

    calendar.entries.push(entry);
    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry added to calendar successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding entry',
      error: error.message
    });
  }
};

// @desc    Update calendar entry
// @route   PUT /api/v1/marketing/content-calendars/:id/entries/:entryId
// @access  Private
exports.updateEntry = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entry = calendar.entries.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        entry[key] = req.body[key];
      }
    });

    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating entry',
      error: error.message
    });
  }
};

// @desc    Schedule entry for publishing
// @route   PUT /api/v1/marketing/content-calendars/:id/entries/:entryId/schedule
// @access  Private
exports.scheduleEntry = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entry = calendar.entries.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    entry.status = 'scheduled';
    entry.date = req.body.date || entry.date;
    entry.time = req.body.time || entry.time;

    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scheduling entry',
      error: error.message
    });
  }
};

// @desc    Mark entry as published
// @route   PUT /api/v1/marketing/content-calendars/:id/entries/:entryId/publish
// @access  Private
exports.publishEntry = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entry = calendar.entries.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    entry.status = 'published';
    entry.publishedAt = new Date();

    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry marked as published'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing entry',
      error: error.message
    });
  }
};

// @desc    Update entry metrics
// @route   PUT /api/v1/marketing/content-calendars/:id/entries/:entryId/metrics
// @access  Private
exports.updateEntryMetrics = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entry = calendar.entries.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    entry.metrics = {
      ...entry.metrics,
      ...req.body
    };

    // Calculate engagement rate
    if (entry.metrics.likes && entry.metrics.comments && entry.metrics.shares && entry.metrics.views) {
      const totalEngagement = entry.metrics.likes + entry.metrics.comments + entry.metrics.shares;
      entry.metrics.engagement = (totalEngagement / entry.metrics.views) * 100;
    }

    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry metrics updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating metrics',
      error: error.message
    });
  }
};

// @desc    Get entries by platform
// @route   GET /api/v1/marketing/content-calendars/:id/platform/:platform
// @access  Private
exports.getEntriesByPlatform = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    const entries = calendar.entries.filter(
      entry => entry.platform === req.params.platform
    );

    res.status(200).json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching entries',
      error: error.message
    });
  }
};

// @desc    Sync calendar with client
// @route   PUT /api/v1/marketing/content-calendars/:id/sync
// @access  Private
exports.syncWithClient = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    calendar.syncedWithClient = true;
    calendar.lastSyncedAt = new Date();

    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Calendar synced with client successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing calendar',
      error: error.message
    });
  }
};

// @desc    Delete entry
// @route   DELETE /api/v1/marketing/content-calendars/:id/entries/:entryId
// @access  Private
exports.deleteEntry = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    calendar.entries.id(req.params.entryId).remove();
    await calendar.save();

    res.status(200).json({
      success: true,
      data: calendar,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting entry',
      error: error.message
    });
  }
};

// @desc    Delete calendar
// @route   DELETE /api/v1/marketing/content-calendars/:id
// @access  Private
exports.deleteCalendar = async (req, res) => {
  try {
    const calendar = await ContentCalendar.findByIdAndDelete(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Content calendar not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content calendar deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting calendar',
      error: error.message
    });
  }
};
