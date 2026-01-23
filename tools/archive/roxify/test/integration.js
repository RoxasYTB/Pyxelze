const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const exe = path.join(__dirname, '..', 'dist', 'rox.exe');
const nodeRunner = process.execPath;
const localWrapper = path.join(__dirname, '..', 'index.js');

let failed = false;

const t1 = spawnSync(nodeRunner, [localWrapper, 'list'], { encoding: 'utf8' });
if (
  !t1.stdout ||
  (!t1.stdout.includes('ROX CLI') && !t1.stdout.includes('Usage: npx rox'))
) {
  console.error(
    'TEST1 FAILED: expected help/usage output for `node index.js list`',
  );
  console.error('stdout:', t1.stdout);
  console.error('stderr:', t1.stderr);
  failed = true;
} else {
  console.log('TEST1 OK: `node index.js list` produced help output');
}

const t2 = spawnSync(
  nodeRunner,
  [localWrapper, 'list', path.join('d:', 'does-not-exist.png'), '--verbose'],
  { encoding: 'utf8' },
);
const combined = (t2.stdout || '') + '\n' + (t2.stderr || '');
if (!/ENOENT|Failed to list files|Error: ENOENT/.test(combined)) {
  console.error(
    'TEST2 FAILED: expected ENOENT or failure details in verbose output',
  );
  console.error('stdout:', t2.stdout);
  console.error('stderr:', t2.stderr);
  failed = true;
} else {
  console.log(
    'TEST2 OK: `node index.js list <missing> --verbose` shows ENOENT/failure',
  );
}

const bundledNode = path.join(__dirname, '..', 'dist', 'node.exe');
if (fs.existsSync(bundledNode)) {
  const t3 = spawnSync(
    bundledNode,
    [localWrapper, 'list', path.join('d:', 'does-not-exist.png'), '--verbose'],
    { encoding: 'utf8' },
  );
  const comb3 = (t3.stdout || '') + '\n' + (t3.stderr || '');
  if (!/ENOENT|Failed to list files|Error: ENOENT/.test(comb3)) {
    console.error(
      'TEST3 FAILED: expected ENOENT/failure with bundled node runner',
    );
    console.error('stdout:', t3.stdout);
    console.error('stderr:', t3.stderr);
    failed = true;
  } else {
    console.log(
      'TEST3 OK: bundled node runner produced ENOENT/failure details',
    );
  }
} else {
  console.log('TEST3 SKIPPED: no bundled node.exe found');
}

process.exit(failed ? 1 : 0);

