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
  const sharpModule = path.join(root, 'node_modules', 'sharp');
  const sharpVendor = path.join(sharpModule, 'vendor');
  const sharpBuild = path.join(sharpModule, 'build', 'Release');

  if (copyDir(sharpVendor, path.join(dist, 'sharp', 'vendor'))) {
    console.log('Copied sharp vendor files to dist/sharp/vendor');
  }
  if (copyDir(sharpBuild, path.join(dist, 'sharp', 'build', 'Release'))) {
    console.log('Copied sharp build/Release files to dist/sharp/build/Release');
  }

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

  const depsToCopy = [
    '@mongodb-js',
    '@img',
    'fflate',
    'lzma-purejs',
    'png-chunks-encode',
    'png-chunks-extract',
    'cli-progress',
    'sharp',
  ];
  for (const dep of depsToCopy) {
    const src = path.join(root, 'node_modules', dep);
    const dest = path.join(dist, 'node_modules', dep);
    if (fs.existsSync(src)) {
      copyDir(src, dest);
      console.log('Copied dependency', dep, 'to dist/node_modules');
    }
  }

  const bundleSrc = path.join(root, 'build', 'rox-bundle.cjs');
  if (fs.existsSync(bundleSrc)) {
    const bundleDest = path.join(dist, 'build');
    copyDir(path.dirname(bundleSrc), bundleDest);
    console.log('Copied bundle to dist/build');
  }
} catch (err) {
  console.error(
    'postbuild copy error:',
    err && err.message ? err.message : err,
  );
  process.exitCode = 1;
}

console.log('postbuild: done');

