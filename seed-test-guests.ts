import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./shared/schema";
import ws from "ws";
import { nanoid } from "nanoid";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const testGuests = [
  // 15 confirmés
  { firstName: "Amélie",    lastName: "Dubois",      status: "confirmed" as const, guestCount: 2, email: "amelie.dubois@test.fr",    phone: "+243810000001" },
  { firstName: "Théodore",  lastName: "Martin",      status: "confirmed" as const, guestCount: 1, email: "theodore.martin@test.fr",  phone: "+243810000002" },
  { firstName: "Isabelle",  lastName: "Ngoma",       status: "confirmed" as const, guestCount: 2, email: "isabelle.ngoma@test.fr",   phone: "+243810000003" },
  { firstName: "Patrick",   lastName: "Muamba",      status: "confirmed" as const, guestCount: 1, email: "patrick.muamba@test.fr",   phone: "+243810000004" },
  { firstName: "Christine", lastName: "Luzolo",      status: "confirmed" as const, guestCount: 2, email: "christine.luzolo@test.fr", phone: "+243810000005" },
  { firstName: "Emmanuel",  lastName: "Kabila",      status: "confirmed" as const, guestCount: 1, email: "emmanuel.kabila@test.fr",  phone: "+243810000006" },
  { firstName: "Sandrine",  lastName: "Bosco",       status: "confirmed" as const, guestCount: 2, email: "sandrine.bosco@test.fr",   phone: "+243810000007" },
  { firstName: "Joëlle",    lastName: "Tshimanga",   status: "confirmed" as const, guestCount: 1, email: "joelle.tshim@test.fr",     phone: "+243810000008" },
  { firstName: "Raphaël",   lastName: "Diallo",      status: "confirmed" as const, guestCount: 2, email: "raphael.diallo@test.fr",   phone: "+243810000009" },
  { firstName: "Nathalie",  lastName: "Kasongo",     status: "confirmed" as const, guestCount: 1, email: "nathalie.kas@test.fr",     phone: "+243810000010" },
  { firstName: "François",  lastName: "Mpiana",      status: "confirmed" as const, guestCount: 2, email: "francois.mpiana@test.fr",  phone: "+243810000011" },
  { firstName: "Cécile",    lastName: "Ilunga",      status: "confirmed" as const, guestCount: 1, email: "cecile.ilunga@test.fr",    phone: "+243810000012" },
  { firstName: "Bertrand",  lastName: "Lukusa",      status: "confirmed" as const, guestCount: 2, email: "bertrand.lukusa@test.fr",  phone: "+243810000013" },
  { firstName: "Véronique", lastName: "Mukendi",     status: "confirmed" as const, guestCount: 1, email: "veronique.muk@test.fr",    phone: "+243810000014" },
  { firstName: "Gilles",    lastName: "Mbuyi",       status: "confirmed" as const, guestCount: 2, email: "gilles.mbuyi@test.fr",     phone: "+243810000015" },
  // 3 en attente
  { firstName: "Aurélie",   lastName: "Ntumba",      status: "pending"   as const, guestCount: 1, email: "aurelie.ntumba@test.fr",   phone: "+243810000016" },
  { firstName: "Cédric",    lastName: "Banza",       status: "pending"   as const, guestCount: 2, email: "cedric.banza@test.fr",     phone: "+243810000017" },
  { firstName: "Marianne",  lastName: "Kalombo",     status: "pending"   as const, guestCount: 1, email: "marianne.kal@test.fr",     phone: "+243810000018" },
  // 2 déclinés
  { firstName: "Victor",    lastName: "Mbaya",       status: "declined"  as const, guestCount: 1, email: "victor.mbaya@test.fr",     phone: "+243810000019" },
  { firstName: "Sylvie",    lastName: "Tshibanda",   status: "declined"  as const, guestCount: 2, email: "sylvie.tshi@test.fr",      phone: "+243810000020" },
];

async function seed() {
  console.log("🌱 Insertion de 20 invités test...");

  for (const guest of testGuests) {
    await db.insert(schema.rsvpResponses).values({
      ...guest,
      token: nanoid(10),
    });
    console.log(`  ✓ ${guest.firstName} ${guest.lastName} (${guest.status})`);
  }

  console.log("\n✅ Terminé — 20 invités test insérés (15 confirmés, 3 en attente, 2 déclinés).");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Erreur :", err);
  pool.end();
  process.exit(1);
});
