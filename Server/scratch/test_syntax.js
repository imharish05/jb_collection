// Server/scratch/test_syntax.js
const path = require('path');
const serverPath = path.join(__dirname, '..');

require('dotenv').config({ path: path.join(serverPath, '.env') });

try {
  console.log('1. Loading database models...');
  require(path.join(serverPath, 'models'));
  
  console.log('2. Loading order controller...');
  const orderController = require(path.join(serverPath, 'controllers/orderController'));
  
  console.log('3. Loading payment controller...');
  const paymentController = require(path.join(serverPath, 'controllers/paymentController'));
  
  console.log('SUCCESS: All files imported without syntax/import errors.');
  process.exit(0);
} catch (err) {
  console.error('SYNTAX/IMPORT ERROR:', err);
  process.exit(1);
}
