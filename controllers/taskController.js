const Task = require('../models/Task');
const createError = require('http-errors');
const { handleRecurringTask } = require('../utils/recurringTaskHandler');

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
      const circularCheck = await task.checkCircularDependencies(updates.dependencies);
      if (!circularCheck.valid) {
        return next(createError(400, {
          code: circularCheck.reason,
          message: circularCheck.message,
          details: circularCheck.cycle ? {
            cycle: circularCheck.cycle
          } : undefined
        }));
      }
      
      // Ensure all dependencies exist and belong to the user
      const dependenciesExist = await Task.countDocuments({
        _id: { $in: updates.dependencies },
        userId
      });
      
      if (dependenciesExist !== updates.dependencies.length) {
        return next(createError(400, {
          code: 'invalid_dependencies',
          message: 'One or more dependencies not found or do not belong to you'
        }));
      }
    }
    
    // Check if status is being updated to 'Completed'
    if (updates.status === 'Completed' && task.status !== 'Completed') {
      const completionCheck = await task.canComplete();
      if (!completionCheck.valid) {
        return next(createError(400, {
          code: completionCheck.reason,
          message: completionCheck.message,
          details: {
            incompleteDependencies: completionCheck.dependencies
          }
        }));
      }
    }
    
    // Store original status to detect completion
    const wasCompleted = task.status === 'Completed';
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });
    
    await task.save();
    
    // Check if task was just marked as completed
    if (task.status === 'Completed' && !wasCompleted) {
      // Handle recurring task logic
      try {
        const newTask = await handleRecurringTask(task);
        
        // Return both the updated task and the newly created recurring task (if any)
        res.status(200).json({
          success: true,
          data: {
            updatedTask: task,
            newRecurringTask: newTask || null
          }
        });
      } catch (error) {
        console.error('Error handling recurring task:', error);
        // Still return the updated task even if recurring handling fails
        res.status(200).json({
          success: true,
          data: task,
          recurringError: 'Failed to generate recurring task'
        });
      }
    } else {
      // Normal response for non-completion updates
      res.status(200).json({
        success: true,
        data: task
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const taskData = { ...req.body, userId: req.user.id };
    
    // Check dependencies if provided
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      // Create a temporary task object for validation
      const tempTask = new Task({
        _id: new mongoose.Types.ObjectId(),
        ...taskData
      });
      
      const circularCheck = await tempTask.checkCircularDependencies(taskData.dependencies);
      if (!circularCheck.valid) {
        return next(createError(400, {
          code: circularCheck.reason,
          message: circularCheck.message,
          details: circularCheck.cycle ? {
            cycle: circularCheck.cycle
          } : undefined
        }));
      }
      
      // Ensure all dependencies exist and belong to the user
      const dependenciesExist = await Task.countDocuments({
        _id: { $in: taskData.dependencies },
        userId: req.user.id
      });
      
      if (dependenciesExist !== taskData.dependencies.length) {
        return next(createError(400, {
          code: 'invalid_dependencies',
          message: 'One or more dependencies not found or do not belong to you'
        }));
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

/**
 * Update task dependencies
 * @route POST /api/tasks/:id/dependencies
 */
exports.updateDependencies = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dependencies } = req.body;
    const userId = req.user.id;
    
    // Find the task
    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    // Check for circular dependencies
    const circularCheck = await task.checkCircularDependencies(dependencies);
    if (!circularCheck.valid) {
      return next(createError(400, {
        code: circularCheck.reason,
        message: circularCheck.message,
        details: circularCheck.cycle ? {
          cycle: await resolveCycleNames(circularCheck.cycle)
        } : undefined
      }));
    }
    
    // Ensure all dependencies exist and belong to the user
    const dependenciesExist = await Task.countDocuments({
      _id: { $in: dependencies },
      userId
    });
    
    if (dependenciesExist !== dependencies.length) {
      return next(createError(400, {
        code: 'invalid_dependencies',
        message: 'One or more dependencies not found or do not belong to you'
      }));
    }
    
    // If task is already completed but dependencies are being added
    if (task.status === 'Completed' && 
        dependencies.length > 0 && 
        (!task.dependencies || task.dependencies.length === 0)) {
      return next(createError(400, {
        code: 'completed_with_dependencies',
        message: 'Cannot add dependencies to an already completed task'
      }));
    }
    
    // Update the dependencies
    task.dependencies = dependencies;
    await task.save();
    
    // Return success with the updated task
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to resolve task IDs to names for better error messages
 * @param {Array} cycle - Array of task IDs in the dependency cycle
 * @returns {Promise<Array>} - Array of objects with id and title
 */
async function resolveCycleNames(cycle) {
  if (!cycle || cycle.length === 0) return [];
  
  const tasks = await Task.find({ _id: { $in: cycle } }).select('title');
  const taskMap = new Map();
  
  tasks.forEach(task => {
    taskMap.set(task._id.toString(), task.title);
  });
  
  return cycle.map(id => ({
    id,
    title: taskMap.get(id) || 'Unknown task'
  }));
}