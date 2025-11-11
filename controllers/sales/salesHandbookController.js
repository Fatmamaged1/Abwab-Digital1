const asyncHandler = require('express-async-handler');
const SalesHandbook = require('../../models/sales/salesHandbookModel');

// @desc    Get all handbook entries
// @route   GET /api/sales/handbook
// @access  Private
exports.getHandbookEntries = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    status,
    search,
    tags,
    sortBy = '-createdAt'
  } = req.query;

  const query = { isDeleted: false };

  // Filters
  if (type) query.type = type;
  if (category) query.category = category;
  if (status) query.status = status;
  if (tags) query.tags = { $in: tags.split(',') };

  // Search
  if (search) {
    query.$text = { $search: search };
  }

  // Visibility check
  query.$or = [
    { visibility: 'public' },
    { visibility: 'team' },
    { allowedUsers: req.user._id },
    { author: req.user._id }
  ];

  const skip = (page - 1) * limit;

  const entries = await SalesHandbook.find(query)
    .populate('author', 'firstName lastName email avatar')
    .populate('lastEditedBy', 'firstName lastName email')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await SalesHandbook.countDocuments(query);

  res.status(200).json({
    success: true,
    count: entries.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: entries
  });
});

// @desc    Get single handbook entry
// @route   GET /api/sales/handbook/:id
// @access  Private
exports.getHandbookEntry = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id)
    .populate('author', 'firstName lastName email avatar')
    .populate('lastEditedBy', 'firstName lastName email')
    .populate('relatedArticles', 'title type category')
    .populate('reviews.user', 'firstName lastName avatar');

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  // Check visibility
  if (
    entry.visibility === 'private' &&
    !entry.author.equals(req.user._id) &&
    !entry.allowedUsers.includes(req.user._id)
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Increment view count
  await entry.incrementView(req.user._id);

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Create handbook entry
// @route   POST /api/sales/handbook
// @access  Private
exports.createHandbookEntry = asyncHandler(async (req, res) => {
  const entryData = {
    ...req.body,
    author: req.user._id
  };

  const entry = await SalesHandbook.create(entryData);

  res.status(201).json({
    success: true,
    data: entry
  });
});

// @desc    Update handbook entry
// @route   PUT /api/sales/handbook/:id
// @access  Private
exports.updateHandbookEntry = asyncHandler(async (req, res) => {
  let entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  // Check permission
  if (!entry.author.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this entry');
  }

  // Track version history
  if (req.body.content && req.body.content !== entry.content) {
    entry.versionHistory.push({
      version: entry.version,
      changes: req.body.versionNotes || 'Content updated',
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    // Increment version
    const [major, minor] = entry.version.split('.');
    entry.version = `${major}.${parseInt(minor) + 1}`;
  }

  const updateData = { ...req.body, lastEditedBy: req.user._id };
  entry = await SalesHandbook.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Delete handbook entry (soft delete)
// @route   DELETE /api/sales/handbook/:id
// @access  Private
exports.deleteHandbookEntry = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  // Check permission
  if (!entry.author.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to delete this entry');
  }

  entry.isDeleted = true;
  entry.lastEditedBy = req.user._id;
  await entry.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Publish handbook entry
// @route   PUT /api/sales/handbook/:id/publish
// @access  Private
exports.publishEntry = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  if (!entry.author.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to publish this entry');
  }

  entry.status = 'published';
  entry.publishedAt = new Date();
  entry.lastEditedBy = req.user._id;
  await entry.save();

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Archive handbook entry
// @route   PUT /api/sales/handbook/:id/archive
// @access  Private
exports.archiveEntry = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  if (!entry.author.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to archive this entry');
  }

  entry.status = 'archived';
  entry.archivedAt = new Date();
  entry.lastEditedBy = req.user._id;
  await entry.save();

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Like/Unlike handbook entry
// @route   PUT /api/sales/handbook/:id/like
// @access  Private
exports.toggleLike = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  await entry.toggleLike(req.user._id);

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Bookmark/Unbookmark handbook entry
// @route   PUT /api/sales/handbook/:id/bookmark
// @access  Private
exports.toggleBookmark = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  await entry.toggleBookmark(req.user._id);

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Add review to handbook entry
// @route   POST /api/sales/handbook/:id/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res) => {
  const entry = await SalesHandbook.findById(req.params.id);

  if (!entry || entry.isDeleted) {
    res.status(404);
    throw new Error('Handbook entry not found');
  }

  // Check if user already reviewed
  const existingReview = entry.reviews.find(r => r.user.equals(req.user._id));
  if (existingReview) {
    // Update existing review
    existingReview.rating = req.body.rating;
    existingReview.comment = req.body.comment;
  } else {
    // Add new review
    entry.reviews.push({
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    });
  }

  await entry.save();

  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Get popular handbook entries
// @route   GET /api/sales/handbook/popular
// @access  Private
exports.getPopularEntries = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const entries = await SalesHandbook.getPopular(limit);

  res.status(200).json({
    success: true,
    count: entries.length,
    data: entries
  });
});

// @desc    Get top rated handbook entries
// @route   GET /api/sales/handbook/top-rated
// @access  Private
exports.getTopRatedEntries = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const entries = await SalesHandbook.getTopRated(limit);

  res.status(200).json({
    success: true,
    count: entries.length,
    data: entries
  });
});

// @desc    Search handbook entries
// @route   GET /api/sales/handbook/search
// @access  Private
exports.searchEntries = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const entries = await SalesHandbook.searchContent(query);

  res.status(200).json({
    success: true,
    count: entries.length,
    data: entries
  });
});

// @desc    Get my bookmarks
// @route   GET /api/sales/handbook/my-bookmarks
// @access  Private
exports.getMyBookmarks = asyncHandler(async (req, res) => {
  const entries = await SalesHandbook.find({
    bookmarkedBy: req.user._id,
    isDeleted: false
  })
    .populate('author', 'firstName lastName email avatar')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: entries.length,
    data: entries
  });
});

// @desc    Get handbook statistics
// @route   GET /api/sales/handbook/stats
// @access  Private
exports.getHandbookStats = asyncHandler(async (req, res) => {
  const stats = await SalesHandbook.aggregate([
    { $match: { isDeleted: false, status: 'published' } },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalViews: { $sum: '$usage.views' },
        totalLikes: { $sum: '$usage.likes' },
        avgRating: { $avg: '$averageRating' }
      }
    }
  ]);

  // Get entries by type
  const byType = await SalesHandbook.aggregate([
    { $match: { isDeleted: false, status: 'published' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get entries by category
  const byCategory = await SalesHandbook.aggregate([
    { $match: { isDeleted: false, status: 'published' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalEntries: 0,
        totalViews: 0,
        totalLikes: 0,
        avgRating: 0
      },
      byType,
      byCategory
    }
  });
});

module.exports = exports;
