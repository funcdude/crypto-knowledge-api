const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('=== Sage Molly startup ===');
console.log('CWD:', process.cwd());

const backend = spawn('python3', [
  '-m', 'uvicorn', 'app.main:app',
  '--host', '0.0.0.0', '--port', '8000',
  '--no-access-log'
], {
  cwd: path.join(process.cwd(), 'backend'),
  stdio: ['ignore', 'inherit', 'inherit'],
  env: process.env
});

backend.on('error', (err) => {
  console.error('BACKEND SPAWN ERROR:', err.message);
});

backend.on('exit', (code, signal) => {
  console.error('BACKEND EXITED: code=' + code + ' signal=' + signal);
});

console.log('Backend spawned, PID:', backend.pid);

function waitForBackend(maxWait) {
  const start = Date.now();
  return new Promise((resolve) => {
    function check() {
      if (Date.now() - start > maxWait) {
        console.log('Backend wait timeout — starting frontend anyway');
        return resolve();
      }
      const req = http.get('http://127.0.0.1:8000/health/live', (res) => {
        if (res.statusCode === 200) {
          console.log('Backend is ready');
          resolve();
        } else {
          setTimeout(check, 2000);
        }
      });
      req.on('error', () => setTimeout(check, 2000));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(check, 2000); });
    }
    check();
  });
}

waitForBackend(120000).then(() => {
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
    console.error('FRONTEND ERROR:', err.message);
    process.exit(1);
  });

  frontend.on('exit', (code) => {
    console.log('Frontend exited:', code);
    backend.kill();
    process.exit(code || 0);
  });

  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
});
