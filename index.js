#!/usr/bin/env node
const path = require('path');

try {
  const exeDir = path.dirname(process.execPath || process.argv[0]);
  process.env.PATH = exeDir + path.delimiter + (process.env.PATH || '');
} catch (e) {}
process.on('uncaughtException', (err) => {
  try {
    console.error('uncaughtException:', err && err.stack ? err.stack : err);
  } catch (e) {
    console.error('uncaughtException');
  }
  process.exitCode = 1;
});

process.on('unhandledRejection', (reason) => {
  try {
    console.error(
      'unhandledRejection:',
      reason && reason.stack ? reason.stack : reason,
    );
  } catch (e) {
    console.error('unhandledRejection');
  }
  process.exitCode = 1;
});

(async () => {
  try {
    console.error('rox wrapper argv (before):', process.argv.slice(2));

    try {
      if (
        process.argv.length > 1 &&
        typeof process.argv[1] === 'string' &&
        process.argv[1].toLowerCase().includes('\\snapshot\\')
      ) {
        console.error('Detected pkg snapshot arg in argv[1], removing it');
        process.argv.splice(1, 1);
      }
    } catch (e) {}
    console.error('rox wrapper argv (after):', process.argv.slice(2));
    console.error('cwd:', process.cwd());
    console.error('execPath:', process.execPath);
    let mod;

    try {
      const fs = require('fs');
      const { pathToFileURL } = require('url');
      const exeDir = path.dirname(process.execPath || process.argv[0]);

      const localBundle = path.join(exeDir, 'build', 'rox-bundle.cjs');
      if (fs.existsSync(localBundle)) {
        console.error(
          'Found local rox bundle at',
          localBundle,
          '— requiring it',
        );
        try {
          const cli = require(localBundle);
          if (typeof cli === 'function') {
            const r = cli(process.argv.slice(2));
            if (r && typeof r.then === 'function') await r;
            return;
          }
        } catch (e) {
          console.error(
            'Error while requiring local bundle:',
            e && e.stack ? e.stack : e,
          );
        }
      }

      const localWrapper = path.join(
        exeDir,
        'roxify',
        'dist',
        'cli_wrapper.js',
      );
      if (fs.existsSync(localWrapper)) {
        console.error(
          'Found external roxify CLI wrapper at',
          localWrapper,
          '— importing it instead of snapshot',
        );
        try {
          await import(pathToFileURL(localWrapper).href);
          return;
        } catch (e) {
          console.error(
            'Error importing cli_wrapper:',
            e && e.stack ? e.stack : e,
          );
          try {
            const { spawnSync } = require('child_process');
            const child = spawnSync(
              process.execPath,
              [localWrapper, ...process.argv.slice(2)],
              { stdio: 'inherit' },
            );
            process.exitCode = child.status || (child.signal && 1);
            return;
          } catch (spawnErr) {
            console.error(
              'Fallback spawn failed:',
              spawnErr && spawnErr.stack ? spawnErr.stack : spawnErr,
            );
          }
        }
      }

      const localCli = path.join(exeDir, 'roxify', 'dist', 'cli.js');
      if (fs.existsSync(localCli)) {
        console.error(
          'Found external roxify CLI at',
          localCli,
          '— importing it instead of snapshot',
        );
        const cliModule = await import(pathToFileURL(localCli).href);
        const cli =
          cliModule && cliModule.default ? cliModule.default : cliModule;
        if (typeof cli === 'function') {
          const r = cli(process.argv.slice(2));
          if (r && typeof r.then === 'function') await r;
          return;
        }
        try {
          const { spawnSync } = require('child_process');
          const child = spawnSync(
            process.execPath,
            [localCli, ...process.argv.slice(2)],
            { stdio: 'inherit' },
          );
          process.exitCode = child.status || (child.signal && 1);
          return;
        } catch (spawnErr) {
          console.error(
            'Fallback spawn of local CLI failed:',
            spawnErr && spawnErr.stack ? spawnErr.stack : spawnErr,
          );
        }
      }
    } catch (e) {}
    try {
      mod = require('roxify');
    } catch (e) {
      const msg = e && e.message ? e.message : '';
      if (
        msg.includes("Unexpected token 'export'") ||
        msg.includes('Cannot use import statement') ||
        msg.includes('must use import to load ES Module') ||
        msg.includes('Unexpected token export')
      ) {
        const imported = await import('roxify');
        mod = imported && imported.default ? imported.default : imported;
      } else {
        throw e;
      }
    }

    if (typeof mod === 'function') {
      try {
        const r = mod(process.argv.slice(2));
        if (r && typeof r.then === 'function') await r;
      } catch (err) {
        console.error(
          'Error while calling main function:',
          err && err.stack ? err.stack : err,
        );
        throw err;
      }
      return;
    }

    if (mod && typeof mod.main === 'function') {
      try {
        const r = mod.main(process.argv.slice(2));
        if (r && typeof r.then === 'function') await r;
      } catch (err) {
        console.error(
          'Error while calling mod.main:',
          err && err.stack ? err.stack : err,
        );
        throw err;
      }
      return;
    }

    try {
      require(path.join(require.resolve('roxify'), '..', 'cli'));
      return;
    } catch (e2) {}

    try {
      const cliModule = await import(
        path.join(path.dirname(require.resolve('roxify')), 'cli')
      );
      const cli =
        cliModule && cliModule.default ? cliModule.default : cliModule;
      if (typeof cli === 'function') {
        const r = cli(process.argv.slice(2));
        if (r && typeof r.then === 'function') await r;
        return;
      }
    } catch (e3) {}

    throw new Error('Could not locate runnable entry point for roxify');
  } catch (err) {
    try {
      console.error(
        'Failed to start roxify:',
        err && err.stack ? err.stack : err,
      );
    } catch (e) {
      console.error('Failed to start roxify');
    }
    try {
      const util = require('util');
      console.error(
        'Failed to start roxify:',
        err && err.message ? err.message : err,
      );
      console.error('Error type:', typeof err);
      try {
        console.error('Error inspect:', util.inspect(err, { depth: null }));
      } catch (e) {}
      if (err && err.stack) console.error('Stack:', err.stack);
      try {
        console.error(
          'err.name:',
          err && err.name,
          'err.code:',
          err && err.code,
        );
      } catch (e) {}
      console.error('process.argv:', JSON.stringify(process.argv));
      console.error('execPath:', process.execPath);
      console.error('cwd:', process.cwd());
      console.error('env.NODE_ENV:', process.env.NODE_ENV);
    } catch (e) {
      try {
        console.error(
          'Failed to log error details:',
          e && e.stack ? e.stack : e,
        );
      } catch (ee) {
        console.error('Failed to log error details');
      }
    }
    process.exitCode = 1;
  }
})();

