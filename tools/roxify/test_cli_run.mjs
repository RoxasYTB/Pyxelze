(async () => {
  try {
    const mod = await import(
      'file:///d:/Users/yohan/Bureau/Pyxelze-Light/Pyxelze/tools/roxify/dist/roxify/dist/cli.js'
    );
    const run = mod && (mod.default || mod);
    if (typeof run === 'function') {
      try {
        await run(['list', 'd:/does/not/exist.png', '--verbose']);
        console.log('Completed');
      } catch (e) {
        console.error('RUN_ERROR', e && e.stack ? e.stack : e);
      }
    } else {
      console.log('cli not function');
    }
  } catch (e) {
    console.error('IMP_ERROR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
