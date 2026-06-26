/*
 * Dev launcher — starts the backend (Express/nodemon) and the frontend (Vite)
 * in parallel from the project root, with colored, prefixed output.
 *
 * Why this exists: there is no app in the project ROOT, so `npm run dev` here
 * used to fail with "Could not read package.json". The real dev scripts live in
 * backend/ and frontend/. This launcher runs both so a single `npm run dev`
 * (from the root) boots the whole app. No external dependencies required.
 *
 * Cross-platform: uses npm.cmd on Windows, npm elsewhere.
 */
const { spawn } = require('child_process');
const path = require('path');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const procs = [
  { name: 'backend', color: '\x1b[36m', cwd: path.join(__dirname, '..', 'backend') },
  { name: 'frontend', color: '\x1b[35m', cwd: path.join(__dirname, '..', 'frontend') },
];
const RESET = '\x1b[0m';

const children = [];

function prefix(name, color, chunk) {
  const tag = `${color}[${name}]${RESET} `;
  return chunk
    .toString()
    .split(/\r?\n/)
    .filter((l) => l.length)
    .map((l) => tag + l)
    .join('\n');
}

for (const p of procs) {
  const child = spawn(npm, ['run', 'dev'], {
    cwd: p.cwd,
    shell: process.platform === 'win32', // needed so npm.cmd resolves on Windows
    env: process.env,
  });
  child.stdout.on('data', (d) => { const s = prefix(p.name, p.color, d); if (s) console.log(s); });
  child.stderr.on('data', (d) => { const s = prefix(p.name, p.color, d); if (s) console.error(s); });
  child.on('exit', (code) => {
    console.log(`${p.color}[${p.name}]${RESET} exited with code ${code}`);
    // If one side dies, tear the other down so you don't get a half-running app.
    shutdown();
  });
  children.push(child);
  console.log(`${p.color}[${p.name}]${RESET} starting in ${p.cwd}`);
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    if (!c.killed) { try { c.kill(); } catch (_) {} }
  }
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, shutdown));
