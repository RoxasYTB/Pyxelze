(async () => {
  try {
    await import(
      'file:///d:/Users/yohan/Bureau/Pyxelze-Light/Pyxelze/tools/roxify/dist/roxify/dist/index.js'
    );
    console.log('OK');
  } catch (e) {
    console.error('ERR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
