// Catalogue CSV parsing + validation (pure functions: no database, easy to test).
// The boutique owner fills docs/CATALOGUE_TEMPLATE.csv in Excel / Google Sheets; scripts/import-csv.ts loads it.

export interface GarmentRow {
  line: number;
  id: string;
  name: string;
  category: string;
  size: string;
  colour?: string;
  fabric?: string;
  description?: string;
  rack: string;
  shelf?: string;
  rentalPrice: number;
  securityDeposit: number;
  purchaseCost: number;
  condition: string;
  notes?: string;
}
export interface Issue {
  line: number; // 1-based line in the file (header = 1); 0 = file-level
  column?: string;
  message: string;
}
export interface CatalogueResult {
  rows: GarmentRow[];
  errors: Issue[];
  warnings: Issue[];
}

export const MAX_ROWS = 2000;
export const REQUIRED = ["sku", "category", "name", "rentalPrice", "deposit", "rack"] as const;

/** header aliases: normalised header (lowercase, letters/digits only) → canonical field */
const ALIASES: Record<string, string> = {
  sku: "sku", id: "sku", code: "sku", garmentid: "sku", itemcode: "sku",
  category: "category", type: "category",
  name: "name", garmentname: "name", item: "name", itemname: "name",
  rentalprice: "rentalPrice", rent: "rentalPrice", price: "rentalPrice", rentalrate: "rentalPrice", rentalpricers: "rentalPrice", rental: "rentalPrice",
  deposit: "deposit", securitydeposit: "deposit", securitydepositrs: "deposit", depositrs: "deposit",
  rack: "rack", shelf: "shelf",
  size: "size", colour: "colour", color: "colour", fabric: "fabric", description: "description",
  purchasecost: "purchaseCost", cost: "purchaseCost", purchaseprice: "purchaseCost", costprice: "purchaseCost", purchasecostrs: "purchaseCost",
  condition: "condition", notes: "notes", note: "notes", remarks: "notes",
};
const LABEL: Record<string, string> = {
  sku: "SKU", category: "Category", name: "Name", rentalPrice: "Rental Price", deposit: "Deposit", rack: "Rack", shelf: "Shelf", size: "Size",
  colour: "Colour", fabric: "Fabric", description: "Description", purchaseCost: "Purchase Cost", condition: "Condition", notes: "Notes",
};

/** RFC-4180-ish CSV: quoted fields, "" escapes, embedded commas/newlines, CRLF/LF, UTF-8 BOM, delimiter , ; or tab (auto-detected). */
export function parseCsv(input: string): { rows: string[][]; lines: number[] } {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [[",", 0], [";", 0], ["\t", 0]];
  let inQ = false;
  for (const ch of firstLine) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ) for (const c of counts) if (c[0] === ch) c[1]++;
  }
  const delim = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ",";

  const rows: string[][] = [];
  const lines: number[] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  let line = 1;
  let rowLine = 1;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((c) => c.trim() !== "")) {
      rows.push(row);
      lines.push(rowLine);
    }
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
    } else if (ch === '"' && cell === "") q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\r") { /* swallowed; \n ends the row */ }
    else if (ch === "\n") { endRow(); line++; rowLine = line; }
    else cell += ch;
  }
  if (q) throw new Error("File ends inside a quoted cell (a \" is not closed)");
  if (cell !== "" || row.length) endRow();
  return { rows, lines };
}

function price(raw: string): number | undefined {
  const s = raw.replace(/₹|rs\.?|inr/gi, "").replace(/[,\s]/g, "");
  if (!/^\d+(\.0+)?$/.test(s)) return undefined;
  return Number(s.split(".")[0]);
}

export function validateCatalogue(csv: string, existingSkus: Set<string> = new Set(), opts: { skipExisting?: boolean } = {}): CatalogueResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const out: GarmentRow[] = [];
  let parsed: ReturnType<typeof parseCsv>;
  try {
    parsed = parseCsv(csv);
  } catch (e) {
    return { rows: [], errors: [{ line: 0, message: (e as Error).message }], warnings };
  }
  if (!parsed.rows.length) return { rows: [], errors: [{ line: 0, message: "The file is empty" }], warnings };

  // header
  const header = parsed.rows[0].map((h) => ALIASES[h.toLowerCase().replace(/[^a-z0-9]/g, "")]);
  const rawHeader = parsed.rows[0];
  rawHeader.forEach((h, i) => { if (!header[i] && h.trim()) warnings.push({ line: 1, column: h.trim(), message: "Unknown column: ignored" }); });
  const col = (f: string) => header.indexOf(f);
  for (const f of REQUIRED) if (col(f) < 0) errors.push({ line: 1, column: LABEL[f], message: `Missing required column "${LABEL[f]}"` });
  if (errors.length) return { rows: [], errors, warnings };
  const seenCols = new Set<string>();
  header.forEach((h) => { if (h && seenCols.has(h)) errors.push({ line: 1, column: LABEL[h], message: `Column "${LABEL[h]}" appears twice` }); if (h) seenCols.add(h); });

  const dataRows = parsed.rows.slice(1);
  if (dataRows.length > MAX_ROWS) errors.push({ line: 0, message: `Too many rows (${dataRows.length}); maximum is ${MAX_ROWS} per import` });
  if (!dataRows.length) errors.push({ line: 0, message: "The file has a header but no garments" });

  const seen = new Map<string, number>();
  dataRows.forEach((cells, idx) => {
    const line = parsed.lines[idx + 1];
    const get = (f: string) => (col(f) >= 0 ? (cells[col(f)] ?? "").trim() : "");
    const err = (f: string, message: string) => errors.push({ line, column: LABEL[f], message });
    const text = (f: string, max: number, required = false): string => {
      const v = get(f);
      if (!v) { if (required) err(f, "is required"); return ""; }
      if (v.length > max) err(f, `is too long (${v.length} characters, max ${max})`);
      if (/^[=@]/.test(v) || /^[+-]\D/.test(v)) err(f, `must not start with "${v[0]}" (spreadsheet formula)`);
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) err(f, "contains invalid control characters");
      return v;
    };

    const sku = text("sku", 40, true).toUpperCase();
    if (sku) {
      if (/^EXAMPLE/.test(sku)) err("sku", "is a template example row: delete the example rows before importing");
      else if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(sku)) err("sku", `"${sku}" may only contain letters, numbers, - and _ (no spaces), 2-40 characters`);
      if (seen.has(sku)) err("sku", `"${sku}" is repeated (first on line ${seen.get(sku)})`);
      else seen.set(sku, line);
    }
    const name = text("name", 120, true);
    const category = text("category", 40, true);
    const rack = text("rack", 40, true);
    const shelf = text("shelf", 40);
    const size = text("size", 20) || "Free Size";

    const money = (f: string, required: boolean, min: number): number => {
      const v = get(f);
      if (!v) { if (required) err(f, "is required"); return 0; }
      const n = price(v);
      if (n === undefined) { err(f, `"${v}" is not a whole number of rupees (write 2500, not 2,500.50)`); return 0; }
      if (n < min) err(f, `must be at least ${min}`);
      if (n > 10_000_000) err(f, "is unrealistically large");
      return n;
    };
    const rentalPrice = money("rentalPrice", true, 1);
    const securityDeposit = money("deposit", true, 0);
    const purchaseCost = money("purchaseCost", false, 0);
    if (rentalPrice && securityDeposit === 0 && get("deposit") !== "") warnings.push({ line, column: "Deposit", message: "is 0: no security deposit will be collected for this garment" });
    if (rentalPrice && securityDeposit > rentalPrice * 5) warnings.push({ line, column: "Deposit", message: `₹${securityDeposit} is more than 5x the rent ₹${rentalPrice}: check for a typo` });
    if (purchaseCost && rentalPrice > purchaseCost) warnings.push({ line, column: "Rental Price", message: "is higher than the purchase cost: check for swapped columns" });

    const colour = text("colour", 40), fabric = text("fabric", 60), description = text("description", 500), notes = text("notes", 500);
    const condition = text("condition", 40) || "Excellent";

    if (sku && existingSkus.has(sku)) {
      if (opts.skipExisting) { warnings.push({ line, column: "SKU", message: `"${sku}" already exists in the database: skipped` }); return; }
      err("sku", `"${sku}" already exists in the database (use --skip-existing to leave it unchanged)`);
    }
    out.push({
      line, id: sku, name, category, size, ...(colour && { colour }), ...(fabric && { fabric }), ...(description && { description }),
      rack, ...(shelf && { shelf }), rentalPrice, securityDeposit, purchaseCost, condition, ...(notes && { notes }),
    });
  });
  return { rows: errors.length ? [] : out, errors, warnings };
}

export function summarise(rows: GarmentRow[]) {
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  const prices = rows.map((r) => r.rentalPrice);
  return {
    count: rows.length,
    categories: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
    rentRange: prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
    racks: new Set(rows.map((r) => r.rack)).size,
  };
}
