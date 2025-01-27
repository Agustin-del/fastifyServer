const path = require('path');
const bytenode = require('bytenode');
<<<<<<< HEAD
// require(path.join(path.dirname(process.execPath), 'src/server.jsc'))
// // Detecta si está ejecutándose en un entorno empaquetado
const bytecodeFile = process.pkg
  ? path.join(path.dirname(process.execPath), 'src/server.jsc')
  : path.join(__dirname, 'server.jsc');


// Carga el bytecode
=======

const bytecodeFile = path.join(__dirname, 'server.jsc');

>>>>>>> df2aaa9 (arreglo repo local)
try {
  require(bytecodeFile);
} catch (error) {
  console.error('Error loading bytecode:', error.message);
  process.exit(1);
}
