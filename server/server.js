const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
require('dotenv').config();

// Import routes
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const tagRoutes = require('./routes/tagRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Log the current directory and the build path to help debug
console.log('Current directory:', __dirname);
console.log('Build path:', path.join(__dirname, '../build'));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../build')));

// Send all other requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// 404 Error Handler
app.use((req, res, next) => {
  next(createError(404, 'Endpoint not found'));
});

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      status: statusCode,
      message: err.message || 'Internal Server Error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
