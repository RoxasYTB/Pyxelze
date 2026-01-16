const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

console.log('Starting optimized postbuild...');

fs.mkdirSync(dist, { recursive: true });

try {
  const nativeNodePath = path.join(
    root,
    'node_modules',
    'roxify',
    'libroxify_native.node',
  );

  const roxifyRoot = '/home/yohan/roxify';
  const possibleDirs = [
    path.join(roxifyRoot, 'target', 'x86_64-pc-windows-gnu', 'release'),
    path.join(roxifyRoot, 'target', 'x86_64-pc-windows-msvc', 'release'),
    path.join(roxifyRoot, 'target', 'release'),
  ];

  const possibleBinaries = [];
  for (const dir of possibleDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        if (/^roxify_native\.(dll|so|dylib|node)$/i.test(e)) {
          possibleBinaries.push(path.join(dir, e));
        }
      }
    } catch (e) {}
  }

  if (possibleBinaries.length) {
    const found = possibleBinaries[0];
    fs.mkdirSync(path.dirname(nativeNodePath), { recursive: true });
    fs.copyFileSync(found, nativeNodePath);
    console.log('Copied built native module from', found, 'to', nativeNodePath);
  }

  // Also try to locate the rust CLI binary (roxify_native) and copy it into dist when available
  const possibleCliNames = ['roxify_native.exe', 'roxify-cli.exe'];
  const possibleCliPaths = [];
  for (const dir of possibleDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        if (possibleCliNames.includes(e)) {
          possibleCliPaths.push(path.join(dir, e));
        }
      }
    } catch (e) {}
  }

  if (possibleCliPaths.length) {
    const cliFound = possibleCliPaths[0];
    const cliDestName = 'roxify_native.exe';
    fs.copyFileSync(cliFound, path.join(dist, cliDestName));
    try {
      fs.chmodSync(path.join(dist, cliDestName), 0o755);
    } catch (e) {}
    console.log(
      'Copied rust CLI binary from',
      cliFound,
      'to',
      path.join(dist, cliDestName),
    );
  } else {
    console.log('No local rust CLI binary found to copy into dist');
  }

  // Copy rox.exe (TypeScript CLI standalone) only if explicitly allowed by env ALLOW_PACKAGED_ROX
  const roxExePath = path.join(roxifyRoot, 'dist', 'rox.exe');
  const allowPackagedRox = process.env.ALLOW_PACKAGED_ROX === '1';
  if (allowPackagedRox) {
    if (fs.existsSync(roxExePath)) {
      const roxDestPath = path.join(dist, 'rox.exe');
      fs.copyFileSync(roxExePath, roxDestPath);
      try {
        fs.chmodSync(roxDestPath, 0o755);
      } catch (e) {}
      console.log(
        'Copied TypeScript CLI standalone from',
        roxExePath,
        'to',
        roxDestPath,
      );
    } else {
      console.warn(
        'NOTICE: rox.exe not found. Skipping packaged rox.exe — use `npm run build:pkg:full` in tools/roxify to generate it if needed.',
      );
    }
  } else {
    console.log(
      'Skipping rox.exe copy by default (not allowed). Set ALLOW_PACKAGED_ROX=1 to include rox.exe if needed.',
    );
  }

  const nativeNode = path.join(
    root,
    'node_modules',
    'roxify',
    'libroxify_native.node',
  );
  if (fs.existsSync(nativeNode)) {
    fs.copyFileSync(nativeNode, path.join(dist, 'libroxify_native.node'));
    console.log('Copied libroxify_native.node to dist root');
  } else {
    console.warn('WARNING: libroxify_native.node not found!');
  }

  try {
    const roxCmdSrc = path.join(root, 'rox.cmd');
    if (fs.existsSync(roxCmdSrc)) {
      fs.copyFileSync(roxCmdSrc, path.join(dist, 'rox.cmd'));
      console.log('Copied rox.cmd');
    }
  } catch (e) {}

  console.log('\n=== Optimized dist structure ===');
  console.log('dist/');
  console.log('  libroxify_native.node  (native module)');
  console.log('  roxify_native          (Rust CLI binary)');
  console.log('  rox.cmd                (launcher)');
  console.log('\nMinimal installer - only Rust binaries!\n');
} catch (err) {
  console.error(
    'postbuild copy error:',
    err && err.message ? err.message : err,
  );
  process.exitCode = 1;
}

console.log('postbuild: done');
