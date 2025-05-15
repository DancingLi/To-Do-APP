const Task = require('../models/Task');
const moment = require('moment');
const createError = require('http-errors');

// Helper function to check for circular dependencies
const checkCircularDependencies = async (taskId, dependencies, visited = new Set()) => {
  if (dependencies.includes(taskId)) return true;
  
  if (dependencies.some(depId => visited.has(depId.toString()))) return true;
  
  for (const depId of dependencies) {
    visited.add(depId.toString());
    const depTask = await Task.findById(depId);
    if (!depTask) continue;
    
    if (await checkCircularDependencies(taskId, depTask.dependencies, new Set(visited))) {
      return true;
    }
  }
  
  return false;
};

// Generate recurring tasks based on a parent task
const generateRecurringTasks = async (parentTask) => {
  if (!parentTask.recurrence || parentTask.recurrence.type === 'none') return [];

  const { recurrence } = parentTask;
  const now = moment();
  let generatedTasks = [];
  let nextDate;

  // Determine the next date based on recurrence type
  switch (recurrence.type) {
    case 'daily':
      nextDate = moment(parentTask.dueDate).add(recurrence.frequency, 'days');
      break;
    case 'weekly':
      nextDate = moment(parentTask.dueDate).add(recurrence.frequency, 'weeks');
      break;
    case 'monthly':
      nextDate = moment(parentTask.dueDate).add(recurrence.frequency, 'months');
      break;
    default:
      return [];
  }

  // Only generate if the next date is in the future and before recurrence end date (if any)
  if (nextDate.isAfter(now) && 
      (!recurrence.endDate || nextDate.isBefore(moment(recurrence.endDate)))) {
    
    // Create new task based on parent
    const newTask = new Task({
      title: parentTask.title,
      description: parentTask.description,
      dueDate: nextDate.toDate(),
      priority: parentTask.priority,
      status: 'todo',
      recurrence: parentTask.recurrence,
      categoryId: parentTask.categoryId,
      tags: parentTask.tags,
      userId: parentTask.userId,
      parentTaskId: parentTask._id
    });

    await newTask.save();
    generatedTasks.push(newTask);
  }

  return generatedTasks;
};

// Controller methods
exports.getAllTasks = async (req, res, next) => {
  try {
    const { 
      priority, 
      status, 
      categoryId, 
      dueDate, 
      search,
      tags,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10
    } = req.query;

    const userId = req.user.id; // Assuming user auth middleware
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId };
    
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    
    if (dueDate) {
      const date = moment(dueDate);
      const startOfDay = date.startOf('day').toDate();
      const endOfDay = date.endOf('day').toDate();
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    // Set up sorting
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by creation date (newest first)
    }
    
    // Execute query with pagination
    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId', 'name color')
      .populate('dependencies', 'title status');
    
    // Get total count for pagination
    const totalTasks = await Task.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTasks / limit)
      },
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })
    .populate('categoryId', 'name color')
    .populate('dependencies', 'title status');
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const taskData = { ...req.body, userId: req.user.id };
    
    // Check dependencies if provided
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      // Ensure all dependencies exist and belong to the user
      const dependenciesExist = await Task.countDocuments({
        _id: { $in: taskData.dependencies },
        userId: req.user.id
      });
      
      if (dependenciesExist !== taskData.dependencies.length) {
        return next(createError(400, 'One or more dependencies not found'));
      }
    }
    
    const newTask = new Task(taskData);
    await newTask.save();
    
    res.status(201).json({
      success: true,
      data: newTask
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    
    // Find the task first to check if it exists and belongs to user
    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    // Check for circular dependencies if updating dependencies
    if (updates.dependencies && updates.dependencies.length > 0) {
      const hasCircular = await checkCircularDependencies(id, updates.dependencies);
      if (hasCircular) {
        return next(createError(400, 'Circular dependency detected'));
      }
      
      // Ensure all dependencies exist and belong to the user
      const dependenciesExist = await Task.countDocuments({
        _id: { $in: updates.dependencies },
        userId
      });
      
      if (dependenciesExist !== updates.dependencies.length) {
        return next(createError(400, 'One or more dependencies not found'));
      }
    }
    
    // Check if status is being updated to 'completed'
    if (updates.status === 'completed' && task.status !== 'completed') {
      const canComplete = await task.canComplete();
      if (!canComplete) {
        return next(createError(400, 'Cannot complete task: dependent tasks are not completed'));
      }
    }
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });
    
    await task.save();
    
    // Generate next recurring task if completing a recurring task
    if (updates.status === 'completed' && task.recurrence && task.recurrence.type !== 'none') {
      await generateRecurringTasks(task);
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if any other tasks depend on this one
    const dependentTasks = await Task.find({ dependencies: id });
    if (dependentTasks.length > 0) {
      return next(createError(400, 'Cannot delete task: other tasks depend on it'));
    }
    
    const task = await Task.findOneAndDelete({ _id: id, userId });
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.generateRecurringTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find all recurring tasks for the user
    const recurringTasks = await Task.find({
      userId,
      'recurrence.type': { $ne: 'none' }
    });
    
    let generatedTasks = [];
    
    // Generate next occurrences for each recurring task
    for (const task of recurringTasks) {
      const newTasks = await generateRecurringTasks(task);
      generatedTasks = [...generatedTasks, ...newTasks];
    }
    
    res.status(200).json({
      success: true,
      count: generatedTasks.length,
      data: generatedTasks
    });
  } catch (error) {
    next(error);
  }
};
