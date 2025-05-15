const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  settings: {
    defaultView: {
      type: String,
      enum: ['list', 'grid', 'calendar', 'kanban'],
      default: 'list'
    },
    defaultFilter: {
      type: String,
      enum: ['all', 'today', 'upcoming', 'completed'],
      default: 'all'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for email lookups
UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
