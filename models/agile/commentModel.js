const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Content
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxLength: [5000, 'Comment cannot exceed 5000 characters']
  },

  // Author
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Parent Entity
  entityType: {
    type: String,
    enum: ['UserStory', 'Task', 'Sprint', 'Epic', 'Milestone'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // Thread Support
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  isReply: {
    type: Boolean,
    default: false
  },

  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],

  // Editing
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    text: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System Fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Indexes
commentSchema.index({ entityType: 1, entityId: 1 });
commentSchema.index({ user: 1 });
commentSchema.index({ project: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });

// Instance methods
commentSchema.methods.addReaction = async function(userId, emoji) {
  const existing = this.reactions.find(r => r.user.equals(userId) && r.emoji === emoji);

  if (existing) {
    // Remove reaction if already exists
    this.reactions = this.reactions.filter(r => !(r.user.equals(userId) && r.emoji === emoji));
  } else {
    // Add new reaction
    this.reactions.push({ user: userId, emoji });
  }

  await this.save();
};

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
