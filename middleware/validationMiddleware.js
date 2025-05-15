const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./errorMiddleware');

// Validate task dependencies
exports.validateTaskDependencies = [
  param('id')
    .isMongoId().withMessage('Invalid task ID'),
  
  body('dependencies')
    .isArray().withMessage('Dependencies must be an array'),
  
  body('dependencies.*')
    .isMongoId().withMessage('Each dependency must be a valid task ID'),
  
  handleValidationErrors
];