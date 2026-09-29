import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const patterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sb_secret_[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b/, /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/, /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/];
let failed = false;
for (const file of new Set(files)) {
  if (/(^|\/)\.env($|\.(?!example$))|^\.harness\/|\.log$/.test(file)) { process.stderr.write('Forbidden versioned artifact: ' + file + '\n'); failed = true; continue; }
  if (patterns.some((pattern) => pattern.test(readFileSync(file, 'utf8')))) { process.stderr.write('Potential secret: ' + file + '\n'); failed = true; }
}
process.stdout.write(failed ? 'Secret scan failed.\n' : 'Secret scan passed (heuristic; manual review also required).\n');
process.exitCode = failed ? 1 : 0;
