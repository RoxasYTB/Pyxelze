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

try {
  const nativeExts = new Set(['.node', '.dll', '.so', '.dylib']);
  function walkAndCopy(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walkAndCopy(p);
      else if (nativeExts.has(path.extname(entry.name).toLowerCase())) {
        const rel = path.relative(root, p);
        const dest = path.join(dist, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(p, dest);
        console.log('Copied native', rel, 'to dist');
      }
    }
  }

  walkAndCopy(path.join(root, 'node_modules'));

  const roxifyDist = path.join(root, 'node_modules', 'roxify', 'dist');
  if (fs.existsSync(roxifyDist)) {
    copyDir(roxifyDist, path.join(dist, 'roxify', 'dist'));
    console.log('Copied roxify dist into dist/roxify/dist');
  }

  const roxifyPkg = path.join(root, 'node_modules', 'roxify', 'package.json');
  if (fs.existsSync(roxifyPkg)) {
    fs.copyFileSync(roxifyPkg, path.join(dist, 'roxify', 'package.json'));
    console.log('Copied roxify package.json into dist/roxify');
  }

  try {
    const installerScript = path.join(root, 'install-rox.cmd');
    if (fs.existsSync(installerScript)) {
      fs.copyFileSync(installerScript, path.join(dist, 'install-rox.cmd'));
      console.log('Copied install-rox.cmd into dist');
    }
    const roxCmdSrc = path.join(root, 'rox.cmd');
    if (fs.existsSync(roxCmdSrc)) {
      fs.copyFileSync(roxCmdSrc, path.join(dist, 'rox.cmd'));
      console.log('Copied rox.cmd into dist');
    }
  } catch (e) {}

  try {
    const cliWrapperPath = path.join(dist, 'roxify', 'dist', 'cli_wrapper.js');
    const wrapperContent = `import('./cli.js').then(mod => {
  try {
    const run = mod && (mod.default || mod);
    if (typeof run === 'function') {
      const res = run(process.argv.slice(2));
      if (res && typeof res.then === 'function') res.catch(e => { require('fs').writeFileSync('${path
        .join(dist, 'failure.log')
        .replace(/\\/g, '\\\\')}', String(e.stack || e)); process.exit(1); });
    }
  } catch (e) { require('fs').writeFileSync('${path
    .join(dist, 'failure.log')
    .replace(/\\/g, '\\\\')}', String(e.stack || e)); process.exit(1); }
}).catch(e => { require('fs').writeFileSync('${path
      .join(dist, 'failure.log')
      .replace(/\\/g, '\\\\')}', String(e.stack || e)); process.exit(1); });
`;
    fs.writeFileSync(cliWrapperPath, wrapperContent, 'utf8');
    console.log('Wrote CLI wrapper to', cliWrapperPath);
  } catch (e) {
    console.error(
      'Failed to write cli_wrapper:',
      e && e.message ? e.message : e,
    );
  }

  const depsToCopy = [];
  for (const dep of depsToCopy) {
    const src = path.join(root, 'node_modules', dep);
    const dest = path.join(dist, 'node_modules', dep);
    if (fs.existsSync(src)) {
      copyDir(src, dest);
      console.log('Copied dependency', dep, 'to dist/node_modules');
    }
  }

  try {
    const zstdRelease = path.join(
      dist,
      'node_modules',
      '@mongodb-js',
      'zstd',
      'build',
      'Release',
      'zstd.node',
    );
    const zstdDebugDir = path.join(
      dist,
      'node_modules',
      '@mongodb-js',
      'zstd',
      'build',
      'Debug',
    );
    if (
      fs.existsSync(zstdRelease) &&
      !fs.existsSync(path.join(zstdDebugDir, 'zstd.node'))
    ) {
      fs.mkdirSync(zstdDebugDir, { recursive: true });
      fs.copyFileSync(zstdRelease, path.join(zstdDebugDir, 'zstd.node'));
      console.log(
        'Copied zstd Release binary into build/Debug to satisfy require(../build/Debug/zstd.node)',
      );
    }
  } catch (e) {}

  const bundleSrc = path.join(root, 'build', 'rox-bundle.cjs');
  if (fs.existsSync(bundleSrc)) {
    const bundleDest = path.join(dist, 'build');
    copyDir(path.dirname(bundleSrc), bundleDest);
    console.log('Copied bundle to dist/build');
    try {
      const zstdInNodeModules = path.join(
        dist,
        'node_modules',
        '@mongodb-js',
        'zstd',
        'build',
        'Release',
        'zstd.node',
      );
      const buildReleaseDir = path.join(dist, 'build', 'Release');
      const buildDebugDir = path.join(dist, 'build', 'Debug');
      if (fs.existsSync(zstdInNodeModules)) {
        fs.mkdirSync(buildReleaseDir, { recursive: true });
        fs.copyFileSync(
          zstdInNodeModules,
          path.join(buildReleaseDir, 'zstd.node'),
        );
        fs.mkdirSync(buildDebugDir, { recursive: true });
        fs.copyFileSync(
          zstdInNodeModules,
          path.join(buildDebugDir, 'zstd.node'),
        );
        console.log('Copied zstd into dist/build/Release and dist/build/Debug');
      }
    } catch (e) {}
  }
} catch (err) {
  console.error(
    'postbuild copy error:',
    err && err.message ? err.message : err,
  );
  process.exitCode = 1;
}

console.log('postbuild: done');
