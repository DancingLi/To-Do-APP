const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { validateTaskDependencies } = require('../middlewares/taskMiddleware');

// Get all tasks
router.get('/', taskController.getAllTasks);

// Get a single task by ID
router.get('/:id', taskController.getTaskById);

// Create a new task
router.post('/', taskController.createTask);

// Update a task
router.put('/:id', taskController.updateTask);

// Delete a task
router.delete('/:id', taskController.deleteTask);

// Add or update task dependencies
router.post('/:id/dependencies', validateTaskDependencies, taskController.updateDependencies);

module.exports = router;