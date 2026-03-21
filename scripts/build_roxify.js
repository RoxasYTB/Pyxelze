const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'bin', 'Debug', 'net8.0-windows', 'roxify'));
const tempDir = path.join(require('os').tmpdir(), 'pyxelze-roxify-build-' + Date.now());
const exeName = process.platform === 'win32' ? 'roxify_native.exe' : 'roxify_native';

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

console.log('Installing roxify@latest...');
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'roxify-build', private: true }));
execSync('npm install roxify@latest', { cwd: tempDir, stdio: 'inherit' });

const roxifyDir = path.join(tempDir, 'node_modules', 'roxify');
const npmBin = path.join(roxifyDir, 'dist', exeName);
const repoBin = path.resolve(__dirname, '..', '..', 'roxify', 'target', 'release', exeName);
const dest = path.join(outDir, exeName);

if (fs.existsSync(npmBin)) {
      fs.copyFileSync(npmBin, dest);
      console.log(`Copied ${exeName} from npm package`);
} else if (fs.existsSync(repoBin)) {
      fs.copyFileSync(repoBin, dest);
      console.log(`Copied ${exeName} from local repo`);
} else {
      console.error(`${exeName} not found in npm package or local repo`);
      process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(roxifyDir, 'package.json'), 'utf8'));
console.log(`roxify ${pkg.version} -> ${outDir}`);
fs.rmSync(tempDir, { recursive: true, force: true });
