const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Format the response based on error structure
  const response = {
    error: {
      status: statusCode,
      message: err.message || 'Internal Server Error'
    }
  };
  
  // Add code and details if available
  if (err.code) {
    response.error.code = err.code;
  }
  
  if (err.details) {
    response.error.details = err.details;
  }
  
  res.status(statusCode).json(response);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});