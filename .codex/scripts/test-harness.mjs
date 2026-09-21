#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const runner = resolve(root, '.codex', 'scripts', 'compact-command.mjs');
const run = (code, marker) => spawnSync(process.execPath, [runner, '--', process.execPath, '-e', `console.log(${JSON.stringify(marker)}); process.exit(${code})`], { cwd: root, encoding: 'utf8' });
const success = run(0, 'HARNESS_SUCCESS_MARKER');
const failure = run(7, 'HARNESS_FAILURE_MARKER');
if (success.status !== 0 || !/result: success/.test(success.stdout)) throw new Error('successful command was not preserved');
if (failure.status !== 7 || !/result: failure \(exit 7/.test(failure.stdout)) throw new Error('failure exit code was not preserved');
const logs = resolve(root, '.harness', 'logs');
if (!existsSync(logs) || !readFileSync(resolve(root, '.gitignore'), 'utf8').includes('.harness/logs/')) throw new Error('logs are not preserved and ignored');
const combinedLogs = readdirSync(logs).map((file) => readFileSync(resolve(logs, file), 'utf8')).join('');
if (!combinedLogs.includes('HARNESS_FAILURE_MARKER')) throw new Error('complete output was not retained');
const hook = resolve(root, '.codex', 'scripts', 'compact-hook.mjs');
const arbitrary = spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_input: { command: 'git status' } }), encoding: 'utf8' });
if (arbitrary.stdout.trim()) throw new Error('hook rewrote an arbitrary command');
const known = spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_input: { command: 'npm test' } }), encoding: 'utf8' });
if (!/updatedInput/.test(known.stdout)) throw new Error('hook did not rewrite a known command');
execFileSync('codex', ['--strict-config', '--help'], { cwd: root, stdio: 'pipe' });
console.log('Harness validation passed: success/failure, retained logs, strict hook scope, and Codex config.');
