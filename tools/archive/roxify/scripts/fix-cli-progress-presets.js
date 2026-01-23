const fs = require('fs');
const path = require('path');

const presetsDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'cli-progress',
  'presets',
);
try {
  fs.mkdirSync(presetsDir, { recursive: true });
  const files = {
    'shades-classic.js':
      "module.exports = {\n    format: ' {bar} {percentage}% | {step} | {elapsed}s',\n    barCompleteChar: '#',\n    barIncompleteChar: '-'\n};",
    'shades-grey.js':
      "module.exports = {\n    format: ' {bar} {percentage}% | {step} | {elapsed}s',\n    barCompleteChar: '█',\n    barIncompleteChar: '░'\n};",
    'rect.js':
      "module.exports = {\n    format: ' {bar} {percentage}% | {step} | {elapsed}s'\n};",
  };

  Object.entries(files).forEach(([name, content]) => {
    const filePath = path.join(presetsDir, name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, { encoding: 'utf8' });
      console.log('Created', filePath);
    }
  });
} catch (err) {
  console.error(
    'fix-cli-progress-presets failed:',
    err && err.message ? err.message : err,
  );
  process.exit(1);
}

