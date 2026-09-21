#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

let input;
try { input = JSON.parse(await new Response(process.stdin).text()); } catch { process.exit(0); }
const command = input?.tool_input?.command;
if (typeof command !== 'string') process.exit(0);

// Deliberately strict: only direct, known verbose package-manager commands are rewritten.
const match = command.match(/^(npm|pnpm|yarn)\s+(test|run\s+(?:test|lint|build|typecheck)|lint|build|typecheck)(\s+[^|&;<>`$()]*)?$/);
if (!match) process.exit(0);
const tokens = command.trim().split(/\s+/);
let root;
try { root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(); } catch { process.exit(0); }
const runner = resolve(root, '.codex', 'scripts', 'compact-command.mjs').replace(/"/g, '\\"');
const rewritten = `node "${runner}" -- ${tokens.map((token) => JSON.stringify(token)).join(' ')}`;
process.stdout.write(JSON.stringify({ hookSpecificOutput: {
  hookEventName: 'PreToolUse', permissionDecision: 'allow', updatedInput: { command: rewritten }
} }));
