const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
const fs = require('fs');
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

// Add this special route for health checks
app.get('/health', (req, res) => {
  res.status(200).send('OK');
  console.log('Health check passed!');
});

// Log when the server starts
console.log('Starting server...');
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
  // Check if the file exists before sending it
  const indexPath = path.join(__dirname, '../build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.log('Error: Could not find index.html file');
    res.status(500).send('Sorry, something went wrong. The application files were not found.');
  }
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
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
