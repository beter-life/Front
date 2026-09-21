#!/usr/bin/env node
import { mkdir, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { basename, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
if (args[0] !== '--' || args.length < 2) {
  console.error('Usage: node .codex/scripts/compact-command.mjs -- <command> [args...]');
  process.exit(64);
}

const [command, ...commandArgs] = args.slice(1);
const root = process.cwd();
const logDirectory = resolve(root, '.harness', 'logs');
await mkdir(logDirectory, { recursive: true });
const safeName = basename(command).replace(/[^a-zA-Z0-9._-]/g, '_') || 'command';
const logPath = resolve(logDirectory, `${new Date().toISOString().replace(/[:.]/g, '-')}-${safeName}.log`);
const log = await open(logPath, 'a');
const started = Date.now();
const child = spawn(command, commandArgs, { cwd: root, shell: false, windowsHide: true });
let bytes = 0;
let tail = '';
const keepTail = 12000;
const write = (chunk) => {
  const text = chunk.toString();
  bytes += Buffer.byteLength(text);
  tail = (tail + text).slice(-keepTail);
  log.write(text);
};
child.stdout.on('data', write);
child.stderr.on('data', write);
child.on('error', (error) => write(Buffer.from(`${error.name}: ${error.message}\n`)));
const result = await new Promise((done) => child.on('close', (code, signal) => done({ code, signal })));
await log.close();

const exitCode = result.code ?? 1;
const displayPath = relative(root, logPath) || logPath;
const duration = ((Date.now() - started) / 1000).toFixed(1);
console.log(`compact-command: ${command} ${commandArgs.join(' ')}`);
console.log(`result: ${exitCode === 0 ? 'success' : 'failure'} (exit ${exitCode}, ${duration}s, ${bytes} bytes)`);
console.log(`full log: ${displayPath}`);
if (exitCode !== 0) {
  const lines = tail.trim().split(/\r?\n/).slice(-80);
  if (lines.length) console.log(`relevant output (tail):\n${lines.join('\n')}`);
}
process.exit(exitCode);
