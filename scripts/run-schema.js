"use strict";

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error("Falta DATABASE_URL. Ejemplo:");
  console.error('  DATABASE_URL="postgresql://user:pass@host:5432/postgres" node scripts/run-schema.js');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: conn });
  await client.connect();
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "schema.sql"),
    "utf8"
  );
  await client.query(sql);
  await client.end();
  console.log("Schema ejecutado correctamente.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
