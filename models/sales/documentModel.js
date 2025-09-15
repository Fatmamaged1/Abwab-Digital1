const { Schema, model } = require("mongoose");

// ===== Document Version Schema =====
const documentVersionSchema = new Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    checksum: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// ===== Main Document Schema =====
const documentSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: [
        "proposal",
        "contract",
        "brochure",
        "presentation",
        "quote",
        "other",
      ],
      required: true,
      index: true,
    },
    currentVersion: {
      type: String,
      default: "1.0",
    },
    url: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },

    // ===== Engagement Tracking =====
    engagement: {
      viewed: { type: Boolean, default: false },
      viewCount: { type: Number, default: 0 },
      totalViewTime: { type: Number, default: 0 }, // seconds
      lastViewedAt: Date,
      lastViewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      uniqueViewers: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          viewCount: { type: Number, default: 1 },
          totalViewTime: { type: Number, default: 0 },
          firstViewedAt: { type: Date, default: Date.now },
          lastViewedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // ===== Versions =====
    versions: [documentVersionSchema],

    // ===== Workflow Status =====
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "signed", "rejected"],
      default: "draft",
      index: true,
    },

    // ===== Permissions =====
    permissions: {
      canView: [{ type: Schema.Types.ObjectId, ref: "User" }],
      canEdit: [{ type: Schema.Types.ObjectId, ref: "User" }],
      isPublic: { type: Boolean, default: false },
    },

    // ===== Metadata =====
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [String],
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    expiresAt: Date,
    externalId: String,
    signatureRequestId: String,
  },
  { timestamps: true }
);

// ===== Indexes for Performance =====
documentSchema.index({ createdAt: -1 });

// ===== Instance Methods =====
documentSchema.methods.trackView = async function (userId, viewTime = 0) {
  this.engagement.viewed = true;
  this.engagement.viewCount += 1;
  this.engagement.totalViewTime += viewTime;
  this.engagement.lastViewedAt = new Date();
  this.engagement.lastViewedBy = userId;

  const existing = this.engagement.uniqueViewers.find(
    (v) => v.user.toString() === userId.toString()
  );

  if (existing) {
    existing.viewCount += 1;
    existing.totalViewTime += viewTime;
    existing.lastViewedAt = new Date();
  } else {
    this.engagement.uniqueViewers.push({
      user: userId,
      viewCount: 1,
      totalViewTime: viewTime,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
    });
  }

  await this.save();
};

module.exports = model("Document", documentSchema);
