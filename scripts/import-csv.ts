// Usage: node --env-file=.env.local scripts/import-csv.ts <catalogue.csv> [--dry-run] [--skip-existing] [--sqlite scratch.db]
// Imports the boutique's garment catalogue (template: docs/CATALOGUE_TEMPLATE.csv).
//  --dry-run        validate everything and show what would happen; writes NOTHING
//  --skip-existing  SKUs already in the database are left unchanged (default: they are an error)
// All-or-nothing: if any row is invalid, nothing is imported and every problem is listed with its line number.
import { readFileSync } from "node:fs";
import { summarise, validateCatalogue } from "./lib/catalogue.ts";
import { openTarget } from "./lib/target.ts";

const argv = process.argv.slice(2);
const file = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--sqlite");
if (!file) throw new Error("Usage: import-csv.ts <catalogue.csv> [--dry-run] [--skip-existing] [--sqlite file]");
const dryRun = argv.includes("--dry-run");

const csv = readFileSync(file, "utf8");
const conn = openTarget(argv);
try {
  const existing = new Set((await conn.query("SELECT id FROM garments")).map((r) => String(r.id).toUpperCase()));
  const res = validateCatalogue(csv, existing, { skipExisting: argv.includes("--skip-existing") });

  for (const w of res.warnings) console.log(`warning  line ${w.line}${w.column ? ` [${w.column}]` : ""}: ${w.message}`);
  for (const e of res.errors) console.log(`ERROR    line ${e.line}${e.column ? ` [${e.column}]` : ""}: ${e.message}`);
  if (res.errors.length) {
    console.log(`\n${res.errors.length} error(s). Nothing was imported. Fix the file and run again.`);
    process.exitCode = 1;
  } else {
    const s = summarise(res.rows);
    console.log(`\n${s.count} garments ready (${s.racks} racks, rent ₹${s.rentRange[0]}–₹${s.rentRange[1]}); database currently has ${existing.size} garments.`);
    console.log(s.categories.map(([c, n]) => `  ${c.padEnd(24)} ${n}`).join("\n"));
    if (dryRun) console.log("\nDRY RUN: nothing was written. Run again without --dry-run to import.");
    else if (!s.count) console.log("Nothing to import.");
    else {
      await conn.run(
        res.rows.map((r) => ({
          sql: `INSERT INTO garments(id,name,category,description,fabric,colour,size,rack,shelf,purchase_cost,rental_price,security_deposit,condition,notes)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [r.id, r.name, r.category, r.description ?? null, r.fabric ?? null, r.colour ?? null, r.size, r.rack, r.shelf ?? null, r.purchaseCost, r.rentalPrice, r.securityDeposit, r.condition, r.notes ?? null],
        })),
      );
      const n = Number((await conn.query("SELECT COUNT(*) n FROM garments"))[0].n);
      console.log(`\nIMPORTED ${s.count} garments. Database now has ${n}.`);
    }
  }
} finally {
  conn.close();
}
