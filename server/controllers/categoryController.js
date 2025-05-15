const Category = require('../models/Category');
const Task = require('../models/Task');
const createError = require('http-errors');

exports.getAllCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const categories = await Category.find({ userId })
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!category) {
      return next(createError(404, 'Category not found'));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = {
      ...req.body,
      userId: req.user.id
    };
    
    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: categoryData.name,
      userId: req.user.id
    });
    
    if (existingCategory) {
      return next(createError(400, 'Category with this name already exists'));
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    
    // Check if category with new name already exists
    if (updates.name) {
      const existingCategory = await Category.findOne({
        name: updates.name,
        userId,
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return next(createError(400, 'Category with this name already exists'));
      }
    }
    
    const category = await Category.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return next(createError(404, 'Category not found'));
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if category is used in any tasks
    const tasksWithCategory = await Task.countDocuments({
      categoryId: id,
      userId
    });
    
    if (tasksWithCategory > 0) {
      return next(createError(400, `Cannot delete category: it is used in ${tasksWithCategory} tasks`));
    }
    
    const category = await Category.findOneAndDelete({
      _id: id,
      userId
    });
    
    if (!category) {
      return next(createError(404, 'Category not found'));
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if the category exists and belongs to the user
    const category = await Category.findOne({ _id: id, userId });
    
    if (!category) {
      return next(createError(404, 'Category not found'));
    }
    
    const tasks = await Task.find({ 
      categoryId: id,
      userId
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
