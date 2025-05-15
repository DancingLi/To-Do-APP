const createError = require('http-errors');
const User = require('../models/User');

// This is a simplified auth middleware for demo purposes
// In a real app, you would implement JWT or other authentication
exports.protect = async (req, res, next) => {
  try {
    // For demo purposes, let's assume the user ID is passed in headers
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return next(createError(401, 'Authentication required'));
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return next(createError(401, 'User not found'));
    }
    
    // Attach user to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    next();
  } catch (error) {
    return next(createError(401, 'Authentication failed'));
  }
};
