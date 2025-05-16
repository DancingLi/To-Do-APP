const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if build folder exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  console.log('Build folder not found, creating it now...');
  try {
    // Run the build command
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build completed!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Start the server
require('./server/server.js');
