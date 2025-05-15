const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateCategoryCreation,
  validateCategoryUpdate
} = require('../middleware/validationMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// Category routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/tasks', categoryController.getCategoryTasks);
router.post('/', validateCategoryCreation, categoryController.createCategory);
router.put('/:id', validateCategoryUpdate, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
