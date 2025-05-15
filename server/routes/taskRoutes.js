const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskQuery
} = require('../middleware/validationMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// Task routes
router.get('/', validateTaskQuery, taskController.getAllTasks);
router.get('/recurring', taskController.generateRecurringTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validateTaskCreation, taskController.createTask);
router.put('/:id', validateTaskUpdate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
