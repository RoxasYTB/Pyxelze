import('./cli.js').then(mod => {
  try {
    const run = mod && (mod.default || mod);
    if (typeof run === 'function') {
      const res = run(process.argv.slice(2));
      if (res && typeof res.then === 'function') res.catch(e => { require('fs').writeFileSync('d:\\Users\\yohan\\Bureau\\Pyxelze-Light\\Pyxelze\\tools\\roxify\\dist\\failure.log', String(e.stack || e)); process.exit(1); });
    }
  } catch (e) { require('fs').writeFileSync('d:\\Users\\yohan\\Bureau\\Pyxelze-Light\\Pyxelze\\tools\\roxify\\dist\\failure.log', String(e.stack || e)); process.exit(1); }
}).catch(e => { require('fs').writeFileSync('d:\\Users\\yohan\\Bureau\\Pyxelze-Light\\Pyxelze\\tools\\roxify\\dist\\failure.log', String(e.stack || e)); process.exit(1); });
