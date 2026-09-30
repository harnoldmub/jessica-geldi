import { eq } from "drizzle-orm";
import { siteSettings } from "@shared/schema";
import { defaultSiteSettings, siteSettingsSchema, type SiteSettings } from "@shared/siteSettings";
import { db } from "./db";

export async function getStoredSiteSettings() {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (!row) return { settings: defaultSiteSettings, revision: 0 };
  return { settings: siteSettingsSchema.parse(row.value), revision: row.revision };
}

export async function saveStoredSiteSettings(settings: SiteSettings, revision: number) {
  const value = siteSettingsSchema.parse(settings);
  const [current] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  const currentRevision = current?.revision ?? 0;
  if (currentRevision !== revision) {
    throw new Error("Les informations ont été modifiées ailleurs. Rechargez avant d’enregistrer.");
  }

  if (!current) {
    const [created] = await db.insert(siteSettings).values({ id: 1, value, revision: 1 }).returning();
    return { settings: siteSettingsSchema.parse(created.value), revision: created.revision };
  }

  const [saved] = await db
    .update(siteSettings)
    .set({ value, revision: currentRevision + 1, updatedAt: new Date() })
    .where(eq(siteSettings.id, 1))
    .returning();
  return { settings: siteSettingsSchema.parse(saved.value), revision: saved.revision };
}
