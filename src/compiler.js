const bytenode = require('bytenode');

bytenode.compileFile({
  filename: './src/server.js',
  output: './src/server.jsc',
  compileAsModule: true, // Importante para usar runBytecodeFile
});