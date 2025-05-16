const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');
console.log('Current directory:', process.cwd());

try {
  // Check if we need to navigate to another directory
  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    console.log('Found src directory, will build from project root');
    
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Run the build command
    console.log('Building React app...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('Build completed successfully!');
  } else {
    console.log('No src directory found. Looking for the React app...');
    console.log('Available directories:');
    fs.readdirSync(process.cwd()).forEach(file => {
      console.log(' - ' + file);
    });
  }
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
