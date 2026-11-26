import { createClient } from "@tursodatabase/serverless/compat";
import { hashPassword } from "../src/server/password.ts";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/TURSO_DATABASE_URL="([^"]+)"/);
const tokenMatch = env.match(/TURSO_AUTH_TOKEN="([^"]+)"/);

if (!urlMatch || !tokenMatch) {
  console.error("Missing TURSO env vars in .env.local");
  process.exit(1);
}

// DEV ONLY. Sets admin/admin123 and staff/staff123. Running this against production would hand anyone the admin login.
if (!process.argv.includes("--i-am-on-a-dev-database")) {
  console.error(`Refusing to run: this sets well-known passwords (admin123 / staff123) on ${urlMatch[1]}.
Never run it against production. For a dev database re-run with --i-am-on-a-dev-database.`);
  process.exit(2);
}

const db = createClient({ url: urlMatch[1], authToken: tokenMatch[1] });

async function main() {
  const adminHash = await hashPassword("admin123");
  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE username = ?",
    args: [adminHash, "admin"],
  });

  const staffHash = await hashPassword("staff123");
  await db.execute({
    sql: "INSERT OR REPLACE INTO users (id, name, username, password_hash, role, active) VALUES (?, ?, ?, ?, 'staff', 1)",
    args: ["USR-0002", "Store Staff", "staff", staffHash],
  });

  console.log("Credentials configured successfully:");
  console.log("Admin: admin / admin123");
  console.log("Staff: staff / staff123");
}

main().catch(console.error);
