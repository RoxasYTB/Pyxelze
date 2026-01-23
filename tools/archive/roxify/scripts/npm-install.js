const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

if (!fs.existsSync(path.join(root, 'package-lock.json'))) {
  console.log('No package-lock.json found, running npm install...');
  try {
    execSync('npm install', { cwd: root, stdio: 'inherit' });
  } catch (e) {
    console.error('npm install failed:', e.message);
    process.exit(1);
  }
} else {
  console.log('Installing from package-lock.json...');
  try {
    execSync('npm ci', { cwd: root, stdio: 'inherit' });
  } catch (e) {
    console.error('npm ci failed, falling back to npm install...');
    try {
      execSync('npm install', { cwd: root, stdio: 'inherit' });
    } catch (e2) {
      console.error('npm install also failed:', e2.message);
      process.exit(1);
    }
  }
}

console.log('Dependencies installed successfully.');

