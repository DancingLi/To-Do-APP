const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { protect } = require('../middleware/authMiddleware');
const { validateTagCreation } = require('../middleware/validationMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// Tag routes
router.get('/', tagController.getAllTags);
router.get('/:tag/tasks', tagController.getTasksByTag);
router.post('/', validateTagCreation, tagController.createTag);
router.delete('/:tag', tagController.deleteTag);

module.exports = router;
