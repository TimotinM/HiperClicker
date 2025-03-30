const fs = require('fs');
const path = require('path');

const directories = [
  'app/components',
  'app/screens',
  'app/hooks',
  'app/state',
  'app/assets',
  'app/navigation',
  'app/utils',
  'config'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

console.log('Directory setup complete!'); 