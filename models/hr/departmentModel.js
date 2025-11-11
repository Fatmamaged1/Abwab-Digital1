const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      office: String,
      floor: String,
      building: String,
    },
    budget: {
      allocated: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    costCenter: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ isDeleted: 1 });

// Virtual for employee count
departmentSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department',
  count: true,
});

// Query middleware to exclude soft-deleted documents
departmentSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Methods
departmentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.status = 'archived';
  return this.save();
};

// Ensure virtual fields are included when converting to JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
