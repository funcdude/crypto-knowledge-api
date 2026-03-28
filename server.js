const { spawn } = require('child_process');
const path = require('path');

console.log('=== Sage Molly startup ===');
console.log('CWD:', process.cwd());

const backend = spawn('python3', [
  '-m', 'uvicorn', 'app.main:app',
  '--host', '0.0.0.0', '--port', '8000'
], {
  cwd: path.join(process.cwd(), 'backend'),
  stdio: 'inherit',
  env: process.env
});

backend.on('error', (err) => {
  console.error('Backend failed to start:', err.message);
});

backend.on('exit', (code) => {
  console.error('Backend exited with code:', code);
});

setTimeout(() => {
  console.log('Starting Next.js on port 5000...');
  const frontend = spawn('node', [
    'node_modules/next/dist/bin/next', 'start',
    '-p', '5000', '-H', '0.0.0.0'
  ], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env
  });

  frontend.on('error', (err) => {
    console.error('Frontend failed to start:', err.message);
    process.exit(1);
  });

  frontend.on('exit', (code) => {
    console.log('Frontend exited with code:', code);
    process.exit(code || 0);
  });
}, 2000);
