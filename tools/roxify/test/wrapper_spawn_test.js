const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const buildDir = path.join(dist, 'build');
const bundlePath = path.join(buildDir, 'rox-bundle.cjs');

function setup() {
  fs.mkdirSync(buildDir, { recursive: true });

  fs.writeFileSync(
    bundlePath,
    'throw new Error("Cannot find module \'../build/Debug/zstd.node\'");\n',
    'utf8',
  );
}

function cleanup() {
  try {
    fs.unlinkSync(bundlePath);
  } catch (e) {}
}

function runTest() {
  setup();
  const runner = fs.existsSync(path.join(dist, 'node.exe'))
    ? path.join(dist, 'node.exe')
    : process.execPath;
  const wrapper = path.join(root, 'index.js');
  const res = spawnSync(runner, [wrapper, 'list', 'd:\\does-not-exist.png'], {
    encoding: 'utf8',
  });
  console.log('stdout:', res.stdout);
  console.log('stderr:', res.stderr);
  const success =
    res.stderr &&
    res.stderr.includes(
      'Missing native module detected in local bundle, spawning node runner for bundle',
    );
  cleanup();
  if (!success) {
    console.error(
      'TEST FAILED: wrapper did not detect missing native module and spawn runner',
    );
    process.exit(1);
  }
  console.log('TEST OK: wrapper spawned node runner for missing native module');
}

runTest();

