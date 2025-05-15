const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    },
    frequency: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: {
      type: Date
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }], // For weekly recurrence (0 = Sunday, 6 = Saturday)
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    } // For monthly recurrence
  },
  dependencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{
    type: String,
    trim: true
  }],
  parentTaskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  }, // For recurring tasks to track their origin
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update timestamps
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if a task can be marked as completed
TaskSchema.methods.canComplete = async function() {
  if (this.dependencies && this.dependencies.length > 0) {
    const Task = mongoose.model('Task');
    const dependencies = await Task.find({ _id: { $in: this.dependencies } });
    return dependencies.every(task => task.status === 'completed');
  }
  return true;
};

// Virtual property for dependent tasks
TaskSchema.virtual('dependentTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'dependencies'
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
