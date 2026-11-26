// Usage: node scripts/perf-run.ts   (npm run perf:audit)
// 1) runs the API test suite with SQL capture on, 2) EXPLAINs every captured statement on a realistic-size scratch DB.
// Exit code 1 if any statement full-scans a large table without being on the allowlist in perf-audit.ts.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "bf-capture-"));
const file = join(dir, "sql.jsonl");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const t = spawnSync(npx, ["vitest", "run", "tests/api"], { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, SQL_CAPTURE: file } });
if (t.status !== 0) { console.error("tests failed; audit aborted"); process.exit(t.status ?? 1); }
const a = spawnSync(process.execPath, ["--no-warnings", "scripts/perf-audit.ts", file], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
process.exit(a.status ?? 1);
