#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

try {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd(), encoding: 'utf8' }).trim();
  const state = (await readFile(resolve(root, 'docs', 'PROJECT_STATE.md'), 'utf8'))
    .replace(/^#.*$/m, '').trim().slice(0, 1400);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: {
    hookEventName: 'SessionStart', additionalContext: `Project state:\n${state}`
  } }));
} catch {
  // Missing state must never block a session.
}
