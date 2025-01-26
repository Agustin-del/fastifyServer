const path = require('path');
const bytenode = require('bytenode');
// require(path.join(path.dirname(process.execPath), 'src/server.jsc'))
// // Detecta si está ejecutándose en un entorno empaquetado
const bytecodeFile = process.pkg
  ? path.join(path.dirname(process.execPath), 'src/server.jsc')
  : path.join(__dirname, 'server.jsc');


// Carga el bytecode
try {
  require(bytecodeFile);
} catch (error) {
  console.error('Error loading bytecode:', error.message);
  process.exit(1);
}
