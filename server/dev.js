const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const expoExecutable = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);

const requestedExpoArgs = process.argv.slice(2);
const hasConnectionMode = requestedExpoArgs.some((arg) =>
  ['--lan', '--localhost', '--tunnel'].includes(arg)
);
const expoArgs = ['start', ...(hasConnectionMode ? [] : ['--lan']), ...requestedExpoArgs];

const api = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
  cwd: projectRoot,
  stdio: 'inherit',
});
const expo = spawn(expoExecutable, expoArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
});

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (!api.killed) api.kill('SIGTERM');
  if (!expo.killed) expo.kill('SIGTERM');
  process.exitCode = exitCode;
}

api.on('exit', (code, signal) => {
  if (!stopping) {
    console.error(`Coach API stopped unexpectedly (${signal || `exit ${code}`}).`);
    stop(code || 1);
  }
});

expo.on('exit', (code) => stop(code || 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
