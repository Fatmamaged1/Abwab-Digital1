const mongoose = require('mongoose');

const projectGanttSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgileProject',
    required: [true, 'Project reference is required'],
    unique: true,
    index: true,
  },
  tasks: [
    {
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
      },
      name: {
        ar: String,
        en: String,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      duration: {
        type: Number, // in days
        required: true,
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      dependencies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
      ],
      assignees: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'blocked', 'delayed'],
        default: 'not-started',
      },
      criticalPath: {
        type: Boolean,
        default: false,
      },
      slack: {
        type: Number, // float (slack time in days)
        default: 0,
      },
      parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
      subtasks: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
      ],
    },
  ],
  milestones: [
    {
      name: {
        ar: String,
        en: String,
      },
      date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ['upcoming', 'completed', 'overdue'],
        default: 'upcoming',
      },
      linkedTasks: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
      ],
      description: String,
    },
  ],
  // AI Predictions
  aiPredictions: {
    bottlenecks: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
        reason: String,
        impact: String,
        recommendation: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
    ],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completionProbability: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    predictedCompletionDate: Date,
    delayRisk: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    suggestedActions: [String],
    predictedAt: Date,
  },
  // Timeline Settings
  settings: {
    workingDaysPerWeek: {
      type: Number,
      default: 5,
    },
    hoursPerDay: {
      type: Number,
      default: 8,
    },
    holidays: [
      {
        date: Date,
        name: String,
      },
    ],
    excludeWeekends: {
      type: Boolean,
      default: true,
    },
  },
  // Baseline for comparison
  baseline: {
    savedAt: Date,
    tasks: mongoose.Schema.Types.Mixed,
    milestones: mongoose.Schema.Types.Mixed,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
projectGanttSchema.index({ project: 1 });
projectGanttSchema.index({ 'tasks.startDate': 1, 'tasks.endDate': 1 });
projectGanttSchema.index({ 'milestones.date': 1 });

// Virtual for project duration
projectGanttSchema.virtual('projectDuration').get(function () {
  if (!this.tasks || this.tasks.length === 0) return 0;

  const startDates = this.tasks.map((t) => new Date(t.startDate).getTime());
  const endDates = this.tasks.map((t) => new Date(t.endDate).getTime());

  const projectStart = new Date(Math.min(...startDates));
  const projectEnd = new Date(Math.max(...endDates));

  const diffTime = Math.abs(projectEnd - projectStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Virtual for overall progress
projectGanttSchema.virtual('overallProgress').get(function () {
  if (!this.tasks || this.tasks.length === 0) return 0;

  const totalProgress = this.tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / this.tasks.length);
});

// Virtual for critical path tasks count
projectGanttSchema.virtual('criticalPathTasksCount').get(function () {
  if (!this.tasks) return 0;
  return this.tasks.filter((task) => task.criticalPath).length;
});

// Method to calculate critical path
projectGanttSchema.methods.calculateCriticalPath = function () {
  // Critical Path Method (CPM) implementation
  const tasks = this.tasks;

  // Reset critical path flags
  tasks.forEach((task) => {
    task.criticalPath = false;
    task.slack = 0;
  });

  // Find the longest path from start to end
  const findLongestPath = (taskId, visited = new Set()) => {
    if (visited.has(taskId.toString())) return 0;

    visited.add(taskId.toString());
    const task = tasks.find((t) => t.taskId.toString() === taskId.toString());

    if (!task) return 0;

    let maxPath = task.duration;
    const dependents = tasks.filter((t) =>
      t.dependencies && t.dependencies.some((dep) => dep.toString() === taskId.toString())
    );

    if (dependents.length > 0) {
      const paths = dependents.map((dep) => findLongestPath(dep.taskId, new Set(visited)));
      maxPath += Math.max(...paths);
    }

    return maxPath;
  };

  // Find tasks with no dependencies (start tasks)
  const startTasks = tasks.filter((t) => !t.dependencies || t.dependencies.length === 0);

  // Calculate critical path for each start task
  let longestPath = 0;
  let criticalStartTask = null;

  startTasks.forEach((task) => {
    const pathLength = findLongestPath(task.taskId);
    if (pathLength > longestPath) {
      longestPath = pathLength;
      criticalStartTask = task.taskId;
    }
  });

  // Mark critical path tasks
  const markCriticalPath = (taskId) => {
    const task = tasks.find((t) => t.taskId.toString() === taskId.toString());
    if (!task) return;

    task.criticalPath = true;
    task.slack = 0;

    const dependents = tasks.filter((t) =>
      t.dependencies && t.dependencies.some((dep) => dep.toString() === taskId.toString())
    );

    if (dependents.length > 0) {
      const longestDependent = dependents.reduce((max, dep) => {
        const depPath = findLongestPath(dep.taskId);
        return depPath > findLongestPath(max.taskId) ? dep : max;
      });

      markCriticalPath(longestDependent.taskId);
    }
  };

  if (criticalStartTask) {
    markCriticalPath(criticalStartTask);
  }

  // Calculate slack for non-critical tasks
  tasks.forEach((task) => {
    if (!task.criticalPath) {
      // Simplified slack calculation
      const latestStart = new Date(task.endDate);
      const earliestStart = new Date(task.startDate);
      task.slack = Math.max(0, (latestStart - earliestStart) / (1000 * 60 * 60 * 24));
    }
  });

  this.lastUpdated = new Date();
};

// Method to save baseline
projectGanttSchema.methods.saveBaseline = function () {
  this.baseline = {
    savedAt: new Date(),
    tasks: JSON.parse(JSON.stringify(this.tasks)),
    milestones: JSON.parse(JSON.stringify(this.milestones)),
  };
};

module.exports = mongoose.model('ProjectGantt', projectGanttSchema);
