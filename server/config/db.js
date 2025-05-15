const mongoose = require('mongoose');

// Add mongoose configurations
mongoose.set('strictQuery', false);

// For debugging purposes in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

module.exports = mongoose;
