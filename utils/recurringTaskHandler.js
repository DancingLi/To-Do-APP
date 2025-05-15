const moment = require('moment');
const mongoose = require('mongoose');
const Task = require('../models/Task');

/**
 * Handles recurring task generation when a task is completed
 * @param {Object} completedTask - The completed task object
 * @returns {Promise<Object|null>} - Returns the newly created recurring task or null
 */
async function handleRecurringTask(completedTask) {
  // Check if task is recurring
  if (!completedTask.recurrence || 
      completedTask.recurrence.type === 'None') {
    return null;
  }

  // Calculate next occurrence date based on recurrence pattern
  const nextDueDate = calculateNextDueDate(completedTask);
  
  // If we couldn't calculate next date or it's past the end date
  if (!nextDueDate) {
    return null;
  }

  // Check for existing duplicate tasks to avoid creating duplicates
  const existingTask = await findDuplicateTask(completedTask, nextDueDate);
  if (existingTask) {
    console.log(`Duplicate task found for ${completedTask.title} on ${nextDueDate}`);
    return null;
  }

  // Create the new recurring task instance
  try {
    const newTask = await createRecurringTaskInstance(completedTask, nextDueDate);
    return newTask;
  } catch (error) {
    console.error('Error creating recurring task:', error);
    throw error;
  }
}

/**
 * Calculates the next due date based on recurrence pattern
 * @param {Object} task - The completed task
 * @returns {Date|null} - The next due date or null if no valid date
 */
function calculateNextDueDate(task) {
  const { recurrence, dueDate } = task;
  if (!dueDate) return null;
  
  const originalDueDate = moment(dueDate);
  let nextDueDate;
  
  switch (recurrence.type) {
    case 'Daily':
      nextDueDate = moment(originalDueDate).add(recurrence.interval || 1, 'days');
      break;
      
    case 'Weekly':
      // If specific days of week are specified
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Get day of week from original due date (0-6, 0 is Sunday)
        const originalDayOfWeek = originalDueDate.day();
        
        // Find the next day of week that is specified in the recurrence
        let daysToAdd = 7 * (recurrence.interval || 1); // Default: one week later
        
        // Sort the days of week to find the next one after current day
        const sortedDays = [...recurrence.daysOfWeek].sort();
        
        // Find the first day that comes after the original day
        const nextDay = sortedDays.find(day => day > originalDayOfWeek);
        
        if (nextDay !== undefined) {
          // If we found a later day in the same week
          daysToAdd = nextDay - originalDayOfWeek;
        } else if (sortedDays.length > 0) {
          // Wrap around to the first day in the next week
          daysToAdd = 7 - originalDayOfWeek + sortedDays[0];
        }
        
        nextDueDate = moment(originalDueDate).add(daysToAdd, 'days');
      } else {
        // Simple weekly recurrence
        nextDueDate = moment(originalDueDate).add(7 * (recurrence.interval || 1), 'days');
      }
      break;
      
    case 'Monthly':
      if (recurrence.dayOfMonth) {
        // If specific day of month is set, use it
        nextDueDate = moment(originalDueDate)
          .add(recurrence.interval || 1, 'months')
          .date(recurrence.dayOfMonth);
          
        // If the day doesn't exist in the month (e.g., Feb 30), 
        // moment will adjust to the last day of the month
      } else {
        // Keep the same day of month
        nextDueDate = moment(originalDueDate).add(recurrence.interval || 1, 'months');
      }
      break;
      
    default:
      return null;
  }
  
  // Check if the next date is past the end date (if one is set)
  if (recurrence.endDate && moment(nextDueDate).isAfter(recurrence.endDate)) {
    return null;
  }
  
  return nextDueDate.toDate();
}

/**
 * Check if a similar task already exists for the given due date
 * @param {Object} originalTask - The original task
 * @param {Date} nextDueDate - The calculated next due date
 * @returns {Promise<Object|null>} - Existing duplicate task or null
 */
async function findDuplicateTask(originalTask, nextDueDate) {
  // Define the time window for checking duplicates (same day)
  const startOfDay = moment(nextDueDate).startOf('day').toDate();
  const endOfDay = moment(nextDueDate).endOf('day').toDate();
  
  // Look for tasks with the same title, user, and due date
  const existingTask = await Task.findOne({
    title: originalTask.title,
    userId: originalTask.userId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    _id: { $ne: originalTask._id }, // Exclude the original task
    isDeleted: false // If your schema uses soft deletes
  });
  
  return existingTask;
}

/**
 * Creates a new instance of a recurring task
 * @param {Object} originalTask - The completed task
 * @param {Date} nextDueDate - The next due date
 * @returns {Promise<Object>} - The newly created task
 */
async function createRecurringTaskInstance(originalTask, nextDueDate) {
  // Extract the properties we want to copy (excluding MongoDB-specific fields)
  const {
    _id, status, completedAt, createdAt, updatedAt, __v, ...taskProps
  } = originalTask.toObject ? originalTask.toObject() : originalTask;

  // Create new task with copied properties but new ID and due date
  const newTask = new Task({
    ...taskProps,
    dueDate: nextDueDate,
    status: 'Todo', // Reset status
    completedAt: null, // Clear completed timestamp
    // Track the relationship to the parent recurring task
    parentTaskId: originalTask._id
  });

  await newTask.save();
  return newTask;
}

/**
 * Process all completed recurring tasks to generate new instances
 * Can be run as a scheduled job
 * @returns {Promise<Array>} - Array of newly created tasks
 */
async function processCompletedRecurringTasks() {
  // Find all completed recurring tasks that might need a new instance
  const completedRecurringTasks = await Task.find({
    status: 'Completed',
    'recurrence.type': { $ne: 'None' },
    // Only tasks completed in the last day to avoid reprocessing old tasks
    completedAt: { $gte: moment().subtract(1, 'day').toDate() }
  });

  const results = [];

  // Process each completed recurring task
  for (const task of completedRecurringTasks) {
    try {
      const newTask = await handleRecurringTask(task);
      if (newTask) {
        results.push(newTask);
      }
    } catch (error) {
      console.error(`Error processing recurring task ${task._id}:`, error);
    }
  }

  return results;
}

/**
 * Generate ISO 8601 interval string from recurrence pattern
 * @param {Object} recurrence - The recurrence object
 * @returns {String} - ISO 8601 interval string
 */
function generateISOIntervalString(recurrence) {
  if (!recurrence || recurrence.type === 'None') {
    return null;
  }

  const interval = recurrence.interval || 1;
  
  switch (recurrence.type) {
    case 'Daily':
      return `R/P${interval}D`; // Repeating every X days
    case 'Weekly':
      return `R/P${interval}W`; // Repeating every X weeks
    case 'Monthly':
      return `R/P${interval}M`; // Repeating every X months
    default:
      return null;
  }
}

/**
 * Parse ISO 8601 interval string into recurrence object
 * @param {String} isoString - ISO 8601 interval string
 * @returns {Object} - Recurrence object
 */
function parseISOIntervalString(isoString) {
  if (!isoString) {
    return { type: 'None', interval: 1 };
  }
  
  // Match pattern like R/P1D, R/P2W, R/P3M
  const pattern = /R\/P(\d+)([DWM])/;
  const matches = isoString.match(pattern);
  
  if (!matches) {
    return { type: 'None', interval: 1 };
  }
  
  const interval = parseInt(matches[1], 10);
  const unit = matches[2];
  
  let type = 'None';
  switch (unit) {
    case 'D': type = 'Daily'; break;
    case 'W': type = 'Weekly'; break;
    case 'M': type = 'Monthly'; break;
  }
  
  return { type, interval };
}

module.exports = {
  handleRecurringTask,
  processCompletedRecurringTasks,
  generateISOIntervalString,
  parseISOIntervalString,
  calculateNextDueDate
};
