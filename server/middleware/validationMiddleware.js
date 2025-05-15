const { body, param, query, validationResult } = require('express-validator');
const createError = require('http-errors');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(createError(400, { errors: errors.array() }));
  }
  next();
};

// Task validation
exports.validateTaskCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Status must be todo, in-progress, or completed'),
  
  body('recurrence.type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly']).withMessage('Recurrence type must be none, daily, weekly, or monthly'),
  
  body('recurrence.frequency')
    .optional()
    .isInt({ min: 1 }).withMessage('Frequency must be a positive integer'),
  
  body('recurrence.endDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('dependencies')
    .optional()
    .isArray().withMessage('Dependencies must be an array'),
  
  body('categoryId')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  handleValidationErrors
];

exports.validateTaskUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid task ID'),
  
  // Only validate fields that are present in the request
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Task title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Status must be todo, in-progress, or completed'),
  
  body('recurrence.type')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly']).withMessage('Recurrence type must be none, daily, weekly, or monthly'),
  
  handleValidationErrors
];

// Category validation
exports.validateCategoryCreation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Name cannot be more than 50 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Color must be a valid hex color code'),
  
  handleValidationErrors
];

exports.validateCategoryUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Category name cannot be empty')
    .isLength({ max: 50 }).withMessage('Name cannot be more than 50 characters'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Color must be a valid hex color code'),
  
  handleValidationErrors
];

// Tag validation
exports.validateTagCreation = [
  body('tag')
    .trim()
    .notEmpty().withMessage('Tag name is required')
    .isLength({ max: 30 }).withMessage('Tag cannot be more than 30 characters'),
  
  body('taskId')
    .isMongoId().withMessage('Invalid task ID'),
  
  handleValidationErrors
];

// Query validation for filtering
exports.validateTaskQuery = [
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  
  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed']).withMessage('Status must be todo, in-progress, or completed'),
  
  query('categoryId')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  query('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];
