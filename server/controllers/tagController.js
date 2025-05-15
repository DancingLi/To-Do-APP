const Task = require('../models/Task');
const createError = require('http-errors');

exports.getAllTags = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Aggregate to get unique tags from tasks
    const tags = await Task.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

exports.createTag = async (req, res, next) => {
  try {
    const { tag, taskId } = req.body;
    const userId = req.user.id;
    
    if (!tag || !taskId) {
      return next(createError(400, 'Tag name and task ID are required'));
    }
    
    // Find the task and add the tag if it doesn't exist
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    if (!task.tags.includes(tag)) {
      task.tags.push(tag);
      await task.save();
    }
    
    res.status(201).json({
      success: true,
      data: task.tags
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTag = async (req, res, next) => {
  try {
    const { tag } = req.params;
    const { taskId } = req.query;
    const userId = req.user.id;
    
    if (!taskId) {
      return next(createError(400, 'Task ID is required'));
    }
    
    // Find the task and remove the tag
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return next(createError(404, 'Task not found'));
    }
    
    // Remove the tag
    task.tags = task.tags.filter(t => t !== tag);
    await task.save();
    
    res.status(200).json({
      success: true,
      message: 'Tag removed successfully',
      data: task.tags
    });
  } catch (error) {
    next(error);
  }
};

exports.getTasksByTag = async (req, res, next) => {
  try {
    const { tag } = req.params;
    const userId = req.user.id;
    
    const tasks = await Task.find({ 
      userId,
      tags: tag 
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};
