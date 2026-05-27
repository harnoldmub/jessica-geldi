import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'rsvp_responses' ORDER BY ordinal_position"
  );
  console.log("Columns:", r.rows.map((x: any) => x.column_name).join(", "));
  await pool.end();
}

main().catch(console.error);
