/**
 * Import des invités du mariage coutumier (Samedi 04 juillet) par table.
 * Ces invités sont enregistrés avec ceremonyChoice = "civil" (journée du samedi :
 * mariage civil & coutumier). Chaque table porte un nom (verset) — voir
 * `coutumierTables` dans shared/glodieSamuel.ts.
 *
 * Le script est idempotent : il ne réinsère pas un invité (même prénom + même
 * table) déjà présent. Lancer avec :  npx tsx --env-file=.env scripts/seedCoutumierGuests.ts
 */
import { db, pool } from "../server/db";
import { rsvpResponses } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const CEREMONY = "civil" as const;

// 16 tables, dans l'ordre de la liste fournie.
const tables: { table: number; guests: string[] }[] = [
  { table: 1, guests: ["Couple BIENZE THEO", "Couple NSIMAY", "Couple MUNGANGA", "Couple MANZANGA", "Couple Tantine GINA"] },
  { table: 2, guests: ["Tantine NGITA", "Papa MOKE", "Couple TARA", "Maman CECILE et GLODIE", "Couple Gisèle MBUKU", "JOSEPHAT ET ESPERANCE", "MICHAELLE"] },
  { table: 3, guests: ["LEVI", "EVODIE", "MONARK", "Couple KALALA", "Couple Dan MAKAYA", "Couple Chimène MBUKU", "NANIVE MAPELE"] },
  { table: 4, guests: ["Couple LEON MWANA NGOMBE", "Couple Sephora MAKAYA", "Couple THETHE MAKAYA", "RHINENE MBUKU", "Couple Josué NSIMAY", "BIBI MBUKU"] },
  { table: 5, guests: ["Couple ABEL", "Maman ANNA", "Justine MBUKU", "Couple Esther MAKUNDA", "Couple BIMBANGU", "Couple TANTINE", "Sœur VERO"] },
  { table: 6, guests: ["Maman MICHELINE", "Couple ULULU", "Couple ALPHONSE", "Couple LOUIS KINDONI", "Couple TEMBE", "Couple LEON MASALA"] },
  { table: 7, guests: ["Couple KITAMBALA", "Maman MADO + ENFANT", "MA JOSE + KOKO MASALA", "LUCIE + JOSEPH", "Couple MATITI"] },
  { table: 8, guests: ["Tantine MWAKA", "Couple MABAYA", "Couple NZUZI MABAYA", "Nadine FUAMBA", "MESCHACK", "CHRISTIAN MAYANU", "NATHAN KIZOMBA", "JEAN RENE"] },
  { table: 9, guests: ["Couple MEDIO", "Couple TONY MANZANGA", "FK", "RABBY", "KBG", "TEZ", "MANDO", "Brady IMBWETE", "Couple JEREMIE BIENZE"] },
  { table: 10, guests: ["Couple NGABALA", "Manasse", "Raissa", "Couple IGNACE MBUKU", "Zenon", "Couple PATRICK", "Doudou", "Rigene"] },
  { table: 11, guests: ["Beni KIBWANI", "Jonathan KIBWANI", "AARON", "KEREN", "PLAMEDIE", "KELLY", "HETHERA", "VLADIMIR", "FANFAR", "CHRISTEVIE"] },
  { table: 12, guests: ["AMELIA", "KADI", "Couple PRISCILLE", "AUDREY", "CHRISTELLE", "ARNOLD MUBUANGA", "Marlène", "NACHA", "AURICIA"] },
  { table: 13, guests: ["BAYI BUANA", "MAMAN PETRONIE", "WONDER", "MARRAINE", "BELLY", "Couple CLEMENTINE", "RUTH", "Couple AWATE"] },
  { table: 14, guests: ["MAMAN NATHALIE", "PAPA GUELORD", "MAMAN GERMAINE", "MAMAN CLAUDINE", "PAPA LEDUGUE", "GLODIE", "ESTHER", "BLENESE", "ANNE", "MAMAN VENANCE"] },
  { table: 15, guests: ["Dr NELLY", "NELLY GOMBE", "ESTHER", "BERTHE", "ALAIN KALALA", "ALEXIS ENTA", "IRENE MAFUTA", "GEORGINE", "WIVINE", "DIVINE"] },
  { table: 16, guests: ["BIBICHE BIBWADI", "MAMAN CLAUDINE", "MAMAN CLAIRE", "Couple ROSETTE", "ORNELLA TSHEKENENE", "Couple MIMI", "Helene", "Couple MAMIE MAYANU", "Mamie BIBWADI et Béa KAFUTI"] },
];

/** Un "couple" / deux personnes nommées => 2, sinon 1. */
function guestCountFor(label: string): number {
  const l = label.trim();
  if (/^couple\b/i.test(l)) return 2;
  if (/\bet\b/i.test(l)) return 2;
  if (/\+/.test(l)) return 2;
  return 1;
}

function clean(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

async function main() {
  // Invités "civil" déjà présents (prénom + table) pour rester idempotent.
  const existing = await db
    .select({ fn: rsvpResponses.firstName, t: rsvpResponses.tableNumber, c: rsvpResponses.ceremonyChoice })
    .from(rsvpResponses)
    .where(eq(rsvpResponses.ceremonyChoice, CEREMONY));
  const seen = new Set(existing.map((r) => `${(r.fn ?? "").trim().toLowerCase()}__${r.t}`));

  let inserted = 0;
  let skipped = 0;
  let people = 0;

  for (const { table, guests } of tables) {
    for (const raw of guests) {
      const firstName = clean(raw);
      const key = `${firstName.toLowerCase()}__${table}`;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      const guestCount = guestCountFor(firstName);
      // Insertion en SQL brut : la base est en retard sur le schéma (colonne
      // beverage_choice non migrée), donc on ne liste que les colonnes existantes.
      await pool.query(
        `INSERT INTO rsvp_responses
           (first_name, last_name, email, phone, status, guest_count, ceremony_choice, table_number, token)
         VALUES ($1, $2, NULL, NULL, $3, $4, $5, $6, $7)`,
        [firstName, "", "pending", guestCount, CEREMONY, table, nanoid(10)],
      );
      seen.add(key);
      inserted++;
      people += guestCount;
    }
  }

  console.log(`Tables traitées : ${tables.length}`);
  console.log(`Invités insérés : ${inserted}`);
  console.log(`Doublons ignorés : ${skipped}`);
  console.log(`Personnes (couples comptés x2) sur les nouveaux : ${people}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERREUR seed :", e.message);
  process.exit(1);
});
