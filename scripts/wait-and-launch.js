const net = require('net');
const { spawn } = require('child_process');
const electronPath = require('electron');

const MAX_ATTEMPTS = 60;
let attempts = 0;

function checkPort() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(5173, '127.0.0.1');
  });
}

async function waitAndLaunch() {
  while (attempts < MAX_ATTEMPTS) {
    const open = await checkPort();
    if (open) {
      console.log('[wait] Port 5173 is open, launching Electron...');
      const child = spawn(electronPath, ['.'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { ...process.env }
      });
      child.on('close', (code) => {
        console.log('[wait] Electron exited with code:', code);
        process.exit(code || 0);
      });
      child.on('error', (err) => {
        console.error('[wait] Electron failed to start:', err.message);
        process.exit(1);
      });
      return;
    }
    attempts++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.error('[wait] Timed out waiting for Vite on port 5173');
  process.exit(1);
}

waitAndLaunch();
