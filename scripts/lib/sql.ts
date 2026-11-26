// Split a migration file into statements: ";" at end of line; a CREATE TRIGGER body runs until its closing "END;".
export function splitSql(sql: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let inTrigger = false;
  for (const raw of sql.split(/\r?\n/)) {
    const line = raw.replace(/\s+--.*$/, "").trimEnd();
    if (!line.trim() || line.trim().startsWith("--")) continue;
    cur.push(line);
    if (/^\s*CREATE\s+TRIGGER/i.test(line)) inTrigger = true;
    const ends = line.endsWith(";") && (!inTrigger || /\bEND;$/i.test(line));
    if (ends) {
      out.push(cur.join("\n"));
      cur = [];
      inTrigger = false;
    }
  }
  if (cur.length) throw new Error("unterminated statement: " + cur[0]);
  return out;
}
