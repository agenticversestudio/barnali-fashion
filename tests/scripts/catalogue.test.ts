import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseCsv, validateCatalogue } from "../../scripts/lib/catalogue";
import { applyMigrations, sqliteConn } from "../../scripts/lib/target";

const H = "SKU,Category,Name,Rental Price,Deposit,Rack,Shelf";
const ok = (rows: string, extra = "") => validateCatalogue(`${H}${extra}\n${rows}`);

describe("parseCsv", () => {
  it("handles quotes, commas, embedded newlines, CRLF, BOM and blank lines", () => {
    const r = parseCsv('﻿a,b,c\r\n"x, y","say ""hi""","two\nlines"\r\n\r\n1,2,3\r\n');
    expect(r.rows).toEqual([["a", "b", "c"], ["x, y", 'say "hi"', "two\nlines"], ["1", "2", "3"]]);
    expect(r.lines).toEqual([1, 2, 5]); // line numbers follow the physical file (cell with a newline spans 2 lines)
  });
  it("detects semicolon and tab delimiters (Excel in some locales)", () => {
    expect(parseCsv("a;b\n1;2").rows[1]).toEqual(["1", "2"]);
    expect(parseCsv("a\tb\n1\t2").rows[1]).toEqual(["1", "2"]);
  });
  it("rejects an unterminated quote", () => {
    expect(() => parseCsv('a,b\n"oops,1')).toThrow(/quoted/);
  });
});

describe("validateCatalogue", () => {
  it("accepts a good row and fills defaults", () => {
    const r = ok("lf-001,Lehenga,Red Lehenga,3500,2000,Rack A-03,Shelf 2");
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({ id: "LF-001", name: "Red Lehenga", rentalPrice: 3500, securityDeposit: 2000, rack: "Rack A-03", shelf: "Shelf 2", size: "Free Size", condition: "Excellent", purchaseCost: 0 });
  });
  it("accepts rupee formatting and header aliases", () => {
    const r = validateCatalogue("Code,Type,Item,Rent,Security Deposit,Rack\nA1,Saree,Silk,\"₹1,500\",Rs. 1000,R1");
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({ rentalPrice: 1500, securityDeposit: 1000 });
  });
  it("reports every problem with line and column, imports nothing", () => {
    const r = ok([
      "A1,Lehenga,Ok,3500,2000,R1,", // fine
      "A1,Lehenga,Dup,3500,2000,R1,", // duplicate sku (line 3)
      "B 2,Saree,Bad sku,3500,2000,R1,", // space in sku (line 4)
      "C3,,No category,abc,2000,R1,", // category missing, price not a number (line 5)
      "D4,Saree,Decimals,2500.50,2000,R1,", // fractional rupees (line 6)
      "E5,Saree,Neg,0,2000,,", // rent 0, rack missing (line 7)
      "F6,Saree,=HYPERLINK(1),100,0,R1,", // formula injection is NOT in name start... name starts with = (line 8)
    ].join("\n"));
    expect(r.rows).toEqual([]);
    const has = (line: number, col: string, re: RegExp) => r.errors.some((e) => e.line === line && e.column === col && re.test(e.message));
    expect(has(3, "SKU", /repeated/)).toBe(true);
    expect(has(4, "SKU", /letters, numbers/)).toBe(true);
    expect(has(5, "Category", /required/)).toBe(true);
    expect(has(5, "Rental Price", /whole number/)).toBe(true);
    expect(has(6, "Rental Price", /whole number/)).toBe(true);
    expect(has(7, "Rental Price", /at least 1/)).toBe(true);
    expect(has(7, "Rack", /required/)).toBe(true);
    expect(has(8, "Name", /formula/)).toBe(true);
  });
  it("missing required column / empty file / header only / template example rows", () => {
    expect(validateCatalogue("SKU,Name\nA,B").errors[0].message).toMatch(/Missing required column/);
    expect(validateCatalogue("").errors[0].message).toMatch(/empty/);
    expect(validateCatalogue(H).errors[0].message).toMatch(/no garments/);
    expect(ok("EXAMPLE-001,Lehenga,X,1000,500,R1,").errors[0].message).toMatch(/example/);
  });
  it("existing SKUs are an error unless skipExisting", () => {
    const csv = `${H}\nA1,Lehenga,X,1000,500,R1,\nA2,Lehenga,Y,1000,500,R1,`;
    expect(validateCatalogue(csv, new Set(["A1"])).errors[0].message).toMatch(/already exists/);
    const r = validateCatalogue(csv, new Set(["A1"]), { skipExisting: true });
    expect(r.errors).toEqual([]);
    expect(r.rows.map((x) => x.id)).toEqual(["A2"]);
  });
  it("warns (does not fail) on suspicious values and unknown columns", () => {
    const r = ok("A1,Lehenga,X,1000,9000,R1,", ",Mystery");
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.message).join("|")).toMatch(/5x the rent/);
    expect(r.warnings.map((w) => w.message).join("|")).toMatch(/Unknown column/);
  });
  it("the shipped template parses; every row is an EXAMPLE row (blocked) and nothing else is wrong", () => {
    const r = validateCatalogue(readFileSync("docs/CATALOGUE_TEMPLATE.csv", "utf8"));
    const dataRows = readFileSync("docs/CATALOGUE_TEMPLATE.csv", "utf8").trim().split(/\r?\n/).length - 1;
    expect(r.errors.length).toBe(dataRows);
    expect(r.errors.every((e) => /example/.test(e.message))).toBe(true);
  });
});

describe("import-csv CLI (scratch SQLite)", () => {
  const dir = mkdtempSync(join(tmpdir(), "bf-import-"));
  const db = join(dir, "i.scratch.db");
  const run = (...a: string[]) => spawnSync(process.execPath, ["--no-warnings", "scripts/import-csv.ts", ...a], { encoding: "utf8" });
  const count = async () => {
    const c = sqliteConn(db);
    const n = Number((await c.query("SELECT COUNT(*) n FROM garments"))[0].n);
    c.close();
    return n;
  };
  beforeAll(async () => {
    const c = sqliteConn(db);
    await applyMigrations(c);
    c.close();
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("dry run writes nothing; real run imports a 500-garment catalogue; re-run is rejected; --skip-existing is idempotent", async () => {
    const lines = [H + ",Size,Colour"];
    for (let i = 1; i <= 500; i++) lines.push(`BF-${String(i).padStart(4, "0")},${["Lehenga", "Saree", "Sherwani"][i % 3]},Garment ${i},${1000 + (i % 10) * 250},${1000 + (i % 4) * 500},Rack ${"ABCD"[i % 4]}-${(i % 20) + 1},Shelf ${(i % 4) + 1},${["S", "M", "L"][i % 3]},Red`);
    const f = join(dir, "cat.csv");
    writeFileSync(f, lines.join("\r\n"));

    const dry = run(f, "--dry-run", "--sqlite", db);
    expect(dry.status).toBe(0);
    expect(dry.stdout).toMatch(/500 garments ready/);
    expect(dry.stdout).toMatch(/DRY RUN/);
    expect(await count()).toBe(0);

    const real = run(f, "--sqlite", db);
    expect(real.status).toBe(0);
    expect(real.stdout).toMatch(/IMPORTED 500/);
    expect(await count()).toBe(500);
    const c = sqliteConn(db);
    expect((await c.query("SELECT rack, shelf, size, status, active FROM garments WHERE id='BF-0001'"))[0]).toEqual({ rack: "Rack B-2", shelf: "Shelf 2", size: "M", status: "AVAILABLE", active: 1 });
    c.close();

    const again = run(f, "--sqlite", db);
    expect(again.status).toBe(1);
    expect(again.stdout).toMatch(/already exists/);
    expect(await count()).toBe(500);

    const skip = run(f, "--skip-existing", "--sqlite", db);
    expect(skip.status).toBe(0);
    expect(skip.stdout).toMatch(/Nothing to import/);
  });

  it("a file with one bad row imports nothing and exits 1", async () => {
    const f = join(dir, "bad.csv");
    writeFileSync(f, `${H}\nZZ-1,Saree,Fine,1000,500,R1,\nZZ-2,Saree,Bad price,xx,500,R1,\n`);
    const r = run(f, "--sqlite", db);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/line 3 \[Rental Price\]/);
    expect(await count()).toBe(500);
  });
});
