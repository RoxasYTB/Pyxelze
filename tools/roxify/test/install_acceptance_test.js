const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(2);
}

const installer =
  process.env.ROX_INSTALLER ||
  path.join(__dirname, '..', '..', '..', 'release', 'Pyxelze-Rox-Setup.exe');
console.log('Using installer path:', installer);
if (!fs.existsSync(installer)) {
  console.error('Installer not found at:', installer);
  process.exit(77);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rox-install-test-'));
const installDir = path.join(tmp, 'Pyxelze-Rox');
console.log('Installing to', installDir);

const args = ['/VERYSILENT', `/DIR=${installDir}`, '/NORESTART'];
const inst = spawnSync(installer, args, {
  windowsHide: true,
  stdio: 'inherit',
});
if (inst.status !== 0) {
  fail('Installer exited with non-zero: ' + (inst.status || inst.signal));
}

const roxExe = path.join(installDir, 'rox.exe');
const roxCmd = path.join(installDir, 'rox.cmd');
const nodeExe = path.join(installDir, 'node.exe');
const installRox = path.join(installDir, 'install-rox.cmd');

if (!fs.existsSync(roxExe)) fail('rox.exe missing from install dir');
if (!fs.existsSync(roxCmd)) fail('rox.cmd missing from install dir');
if (!fs.existsSync(nodeExe)) fail('node.exe missing from install dir');
if (!fs.existsSync(installRox))
  fail('install-rox.cmd missing from install dir');

console.log('Installed files present. Running help check...');
const help = spawnSync(roxExe, ['--help'], {
  env: Object.assign({}, process.env, { PATH: '' }),
  encoding: 'utf8',
  windowsHide: true,
});
if (help.status !== 0) {
  console.error('rox --help exited non-zero', help.status, help.signal);
  console.error('stdout:', help.stdout);
  console.error('stderr:', help.stderr);
  fail('rox --help failed');
}
if (!help.stdout || help.stdout.length < 10) {
  console.error('stdout too small:', help.stdout);
  fail('rox --help produced no/too small output');
}
console.log('Acceptance test passed. Cleaning up...');
try {
  fs.rmSync(installDir, { recursive: true, force: true });
  fs.rmdirSync(tmp, { recursive: true });
} catch (e) {}
process.exit(0);


