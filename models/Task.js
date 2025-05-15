const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: true // Index for faster searching
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  dueDate: {
    type: Date,
    index: true // Index for date-based queries and sorting
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    index: true // Index for filtering by priority
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Completed'],
    default: 'Todo',
    index: true // Index for status filtering
  },
  recurrence: {
    type: {
      type: String,
      enum: ['None', 'Daily', 'Weekly', 'Monthly'],
      default: 'None'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: {
      type: Date
    },
    daysOfWeek: [{ // For weekly recurrence (0=Sunday, 6=Saturday)
      type: Number,
      min: 0,
      max: 6
    }]
  },
  tags: [{
    type: String,
    trim: true,
    index: true // Index for tag-based filtering
  }],
  dependencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Important index for user-specific queries
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    index: true // Index for category-based filtering
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true // For soft delete functionality
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for commonly used queries
TaskSchema.index({ userId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, categoryId: 1 });
TaskSchema.index({ userId: 1, tags: 1 });

// Virtual for dependent tasks (tasks that depend on this task)
TaskSchema.virtual('dependentTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'dependencies'
});

// Pre-save middleware for updating completedAt when status changes to 'Completed'
TaskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Method to check if task can be completed based on dependencies
TaskSchema.methods.canComplete = async function() {
  if (!this.dependencies || this.dependencies.length === 0) {
    return { valid: true };
  }
  
  const Task = mongoose.model('Task');
  const incompleteDependencies = await Task.find({
    _id: { $in: this.dependencies },
    status: { $ne: 'Completed' }
  }).select('title');
  
  if (incompleteDependencies.length > 0) {
    return {
      valid: false,
      reason: 'incomplete_dependencies',
      message: 'Cannot complete task: some dependencies are not completed',
      dependencies: incompleteDependencies.map(task => ({
        id: task._id,
        title: task.title
      }))
    };
  }
  
  return { valid: true };
};

/**
 * Check for circular dependencies
 * @param {Array} newDependencies - Array of task IDs to check
 * @returns {Promise<Object>} - Validation result
 */
TaskSchema.methods.checkCircularDependencies = async function(newDependencies) {
  if (!newDependencies || newDependencies.length === 0) {
    return { valid: true };
  }
  
  const Task = mongoose.model('Task');
  const taskId = this._id.toString();
  const visited = new Set();
  const pathStack = [];
  
  // DFS to detect cycles
  const hasCycle = async (currentId, path) => {
    // If we've visited this node and found a cycle
    if (currentId === taskId) {
      return { 
        hasCycle: true, 
        path: [...path, taskId] 
      };
    }
    
    // If already visited but no cycle was found through this path
    if (visited.has(currentId)) {
      return { hasCycle: false };
    }
    
    visited.add(currentId);
    const currentPath = [...path, currentId];
    
    const task = await Task.findById(currentId);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return { hasCycle: false };
    }
    
    // Check each dependency
    for (const depId of task.dependencies) {
      const result = await hasCycle(depId.toString(), currentPath);
      if (result.hasCycle) {
        return result;
      }
    }
    
    return { hasCycle: false };
  };
  
  // Check each new dependency
  for (const depId of newDependencies) {
    if (depId === taskId) {
      return {
        valid: false,
        reason: 'self_dependency',
        message: 'A task cannot depend on itself',
        cycle: [taskId]
      };
    }
    
    const result = await hasCycle(depId.toString(), [taskId]);
    if (result.hasCycle) {
      return {
        valid: false,
        reason: 'circular_dependency',
        message: 'Circular dependency detected',
        cycle: result.path
      };
    }
  }
  
  return { valid: true };
};

// Static method to find tasks due soon
TaskSchema.statics.findDueSoon = function(userId, days = 7) {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);
  
  return this.find({
    userId,
    dueDate: { $gte: today, $lte: future },
    status: { $ne: 'Completed' }
  }).sort({ dueDate: 1 });
};

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
