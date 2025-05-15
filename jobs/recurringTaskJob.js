const { processCompletedRecurringTasks } = require('../utils/recurringTaskHandler');
const mongoose = require('mongoose');
require('dotenv').config();

// Function to connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Main processing function
async function runRecurringTaskJob() {
  try {
    console.log('Starting recurring task job:', new Date().toISOString());
    
    // Connect to database
    await connectDB();
    
    // Process all completed recurring tasks
    const results = await processCompletedRecurringTasks();
    
    console.log(`Created ${results.length} new recurring tasks`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return results;
  } catch (error) {
    console.error('Error in recurring task job:', error);
    
    // Ensure database connection is closed on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  runRecurringTaskJob()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runRecurringTaskJob;
