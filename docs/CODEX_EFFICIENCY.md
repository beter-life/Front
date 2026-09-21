# Codex efficiency

## Strategy

Keep always-loaded instructions short; place specialized guidance in scoped Skills.
`PROJECT_STATE.md` is the compact handoff snapshot. Git remains the history.

## Configuration

Project configuration retains at most 5,000 tokens per tool result, uses cached web
search, and limits the Skills catalog to 2,000 tokens. Model context and compaction
thresholds use Codex defaults. A SessionStart hook supplies only the state snapshot.

## Compact logs

Run `node .codex/scripts/compact-command.mjs -- <command> [args...]`. It runs the
actual program, preserves its exit code, stores combined output under `.harness/logs/`,
and prints a short summary plus relevant tail on failure. Inspect the named log in
small ranges if more evidence is needed.

The optional PreToolUse hook redirects only exact, direct `npm`/`pnpm`/`yarn` test,
lint, build, and typecheck commands. It leaves every other command unchanged.

## When to use what

Read the matching local Skill only when its specialty is needed. Prefer local CLI;
use plugins only for an actual GitHub, Exa, or OpenAI Developers task. Never allow an
automatic paid-service upgrade. Use subagents only when their isolation or parallelism
outweighs their added context cost.

## Resume elsewhere

Clone the repository, use Node.js 20+ and a current Codex CLI, trust the project
configuration when prompted, then read `docs/PROJECT_STATE.md` and run the harness
self-test. Local logs are intentionally ignored and do not transfer with Git.
