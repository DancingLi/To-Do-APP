const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    default: '#3498db', // Default color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Important for user-specific queries
  },
  order: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient retrieval
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Virtual for tasks in this category
CategorySchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'categoryId',
  options: { 
    match: { isDeleted: false } 
  }
});

// Method to get task count in category
CategorySchema.statics.getTaskCounts = async function(userId) {
  const Task = mongoose.model('Task');
  
  return await Task.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isDeleted: false } },
    { $group: {
        _id: '$categoryId',
        count: { $sum: 1 },
        completedCount: { 
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        }
      }
    }
  ]);
};

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
