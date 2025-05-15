const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProgressTrackingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  tasksDone: {
    type: Number,
    default: 0
  },
  tasksTotal: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // For weekly tracking
  weekNumber: {
    type: Number
  },
  // For monthly tracking
  month: {
    type: Number
  },
  year: {
    type: Number,
    required: true
  },
  categories: [{
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    tasksDone: Number,
    tasksTotal: Number,
    completionPercentage: Number
  }]
}, {
  timestamps: true
});

// Create compound indices for efficient querying
ProgressTrackingSchema.index({ userId: 1, date: 1, period: 1 }, { unique: true });
ProgressTrackingSchema.index({ userId: 1, year: 1, period: 1 });
ProgressTrackingSchema.index({ userId: 1, date: -1 }); // For recent activity

// Static method to update or create daily progress
ProgressTrackingSchema.statics.updateDailyProgress = async function(userId) {
  const Task = mongoose.model('Task');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get tasks for today
  const tasks = await Task.find({
    userId,
    isDeleted: false,
    $or: [
      // Tasks due today
      { dueDate: { 
        $gte: today, 
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
      }},
      // Tasks completed today
      { 
        completedAt: { 
          $gte: today, 
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        } 
      }
    ]
  }).populate('categoryId');
  
  // Calculate overall stats
  const tasksTotal = tasks.length;
  const tasksDone = tasks.filter(task => task.status === 'Completed').length;
  const completionPercentage = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  
  // Calculate per-category stats
  const categoryMap = new Map();
  tasks.forEach(task => {
    if (!task.categoryId) return;
    
    const categoryId = task.categoryId._id.toString();
    const categoryName = task.categoryId.name;
    
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        tasksDone: 0,
        tasksTotal: 0,
        completionPercentage: 0
      });
    }
    
    const categoryStats = categoryMap.get(categoryId);
    categoryStats.tasksTotal++;
    if (task.status === 'Completed') {
      categoryStats.tasksDone++;
    }
  });
  
  // Calculate completion percentage for each category
  const categories = Array.from(categoryMap.values()).map(category => {
    category.completionPercentage = category.tasksTotal > 0 
      ? Math.round((category.tasksDone / category.tasksTotal) * 100) 
      : 0;
    return category;
  });
  
  // Update or create the progress entry
  return this.findOneAndUpdate(
    { 
      userId, 
      date: today,
      period: 'daily'
    },
    {
      userId,
      date: today,
      period: 'daily',
      tasksDone,
      tasksTotal,
      completionPercentage,
      weekNumber: getWeekNumber(today),
      month: today.getMonth(),
      year: today.getFullYear(),
      categories
    },
    { upsert: true, new: true }
  );
};

// Helper function to get week number
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Static method to generate weekly progress
ProgressTrackingSchema.statics.generateWeeklySummary = async function(userId, date = new Date()) {
  const weekNumber = getWeekNumber(date);
  const year = date.getFullYear();
  
  // Get all daily progress records for this week
  const dailyRecords = await this.find({
    userId,
    period: 'daily',
    weekNumber,
    year
  }).sort({ date: 1 });
  
  if (dailyRecords.length === 0) {
    return null;
  }
  
  // Aggregate data from daily records
  let tasksDone = 0;
  let tasksTotal = 0;
  const categoryMap = new Map();
  
  dailyRecords.forEach(record => {
    tasksDone += record.tasksDone;
    tasksTotal += record.tasksTotal;
    
    // Aggregate category data
    record.categories.forEach(category => {
      const categoryId = category.categoryId.toString();
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: category.categoryName,
          tasksDone: 0,
          tasksTotal: 0
        });
      }
      
      const categoryStat = categoryMap.get(categoryId);
      categoryStat.tasksDone += category.tasksDone;
      categoryStat.tasksTotal += category.tasksTotal;
    });
  });
  
  // Calculate overall completion percentage
  const completionPercentage = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  
  // Calculate per-category completion percentage
  const categories = Array.from(categoryMap.values()).map(category => {
    category.completionPercentage = category.tasksTotal > 0 
      ? Math.round((category.tasksDone / category.tasksTotal) * 100) 
      : 0;
    return category;
  });
  
  // Get first day of the week
  const firstDay = new Date(date);
  firstDay.setDate(date.getDate() - date.getDay());
  firstDay.setHours(0, 0, 0, 0);
  
  // Update or create weekly progress record
  return this.findOneAndUpdate(
    { userId, weekNumber, year, period: 'weekly' },
    {
      userId,
      date: firstDay,
      period: 'weekly',
      weekNumber,
      year,
      tasksDone,
      tasksTotal,
      completionPercentage,
      categories
    },
    { upsert: true, new: true }
  );
};

const ProgressTracking = mongoose.model('ProgressTracking', ProgressTrackingSchema);

module.exports = ProgressTracking;
