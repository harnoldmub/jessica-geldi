import { z } from "zod";
import { JessicaGeldi, weddingEvents, type WeddingEventKey } from "./JessicaGeldi";

const eventSettingsSchema = z.object({
  venue: z.string().trim().max(160),
  address: z.string().trim().max(300),
  mapsUrl: z.string().trim().max(600),
  note: z.string().trim().max(1000),
});

export const siteSettingsSchema = z.object({
  heroSubtitle: z.string().trim().min(1).max(240),
  invitationText: z.string().trim().min(1).max(1200),
  storyText: z.string().trim().min(1).max(4000),
  events: z.object({
    customary: eventSettingsSchema,
    civil: eventSettingsSchema,
    evening: eventSettingsSchema,
  }),
  program: z.array(z.object({
    event: z.enum(["customary", "civil", "evening"]),
    time: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    text: z.string().trim().max(500),
  })).min(1).max(12),
  contribution: z.object({
    enabled: z.boolean(),
    title: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(1500),
  }),
  practical: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    text: z.string().trim().min(1).max(1500),
  })).max(12),
  footerText: z.string().trim().min(1).max(1000),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

const eventKeys = Object.keys(weddingEvents) as WeddingEventKey[];

export const defaultSiteSettings: SiteSettings = {
  heroSubtitle: "10, 12 & 13 février 2027 · Kinshasa, RD Congo",
  invitationText: JessicaGeldi.couple.statement,
  storyText: JessicaGeldi.couple.narrative,
  events: eventKeys.reduce((result, key) => {
    const event = weddingEvents[key];
    result[key] = {
      venue: event.venue,
      address: "Kinshasa, RD Congo",
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${event.venue}, Kinshasa`)}`,
      note: event.themeNote,
    };
    return result;
  }, {} as SiteSettings["events"]),
  program: eventKeys.flatMap((key): SiteSettings["program"] =>
    key === "civil"
      ? [
          { event: key, time: "13H", title: "Mariage civil", text: weddingEvents[key].theme },
          { event: key, time: "15H", title: "Bénédiction", text: "" },
        ]
      : [{ event: key, time: weddingEvents[key].time, title: weddingEvents[key].label, text: weddingEvents[key].theme }],
  ),
  contribution: {
    enabled: true,
    title: "Votre présence est notre plus beau cadeau.",
    message: "Pour celles et ceux qui souhaitent nous témoigner une attention, une contribution en espèces pourra se faire directement lors des célébrations.",
  },
  practical: [
    {
      title: "Lieu",
      text: "Kinshasa, Congo.",
    },
  ],
  footerText: JessicaGeldi.couple.statement,
};

/*
 * Réglages enregistrés avant oct. 2026 : le « religieux du 14 » est devenu la soirée dansante du 13 (clé `evening`)
 * et les lieux sont connus. On convertit à la lecture ; les textes personnalisés dans l'admin sont conservés,
 * seuls les anciens textes par défaut (« lieu à confirmer », anciennes dates) sont remplacés.
 */
export function normalizeStoredSiteSettings(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const value = structuredClone(raw) as Record<string, any>;
  const defaults = defaultSiteSettings;

  if (value.events && typeof value.events === "object") {
    if (value.events.religious && !value.events.evening) {
      value.events.evening = value.events.religious;
    }
    delete value.events.religious;
    for (const key of eventKeys) {
      const current = value.events[key];
      if (!current) {
        value.events[key] = defaults.events[key];
        continue;
      }
      if (!current.venue || /à confirmer/i.test(current.venue)) {
        value.events[key] = { ...current, venue: defaults.events[key].venue, mapsUrl: defaults.events[key].mapsUrl };
      }
      if (key === "civil" && current.note === "Une palette douce et lumineuse, rose poudré, bleu ciel, lilas et crème.") {
        value.events[key] = { ...value.events[key], note: "" };
      }
      if (key === "evening" && /religieu|bénédiction|solennelle|ivoire|noir profond/i.test(current.note || "")) {
        value.events[key] = { ...value.events[key], note: defaults.events[key].note };
      }
    }
  }

  if (Array.isArray(value.program)) {
    value.program = value.program.map((item: Record<string, any>) => {
      const event = item.event === "religious" ? "evening" : item.event;
      const fallback = defaults.program.find((p) => p.event === event);
      if (!fallback) return { ...item, event };
      const isOldDefault = (field: string, pattern: RegExp) => typeof item[field] === "string" && pattern.test(item[field]);
      return {
        ...item,
        event,
        title: isOldDefault("title", /^Mariage (religieux|civil)$/) ? fallback.title : item.title,
        time: item.event === "religious" && item.time === "11H" ? fallback.time : item.time,
        // Anciens textes par défaut (« lieu à confirmer », « Thème · Kinshasa, Congo. ») → le thème seul
        text: isOldDefault("text", /lieu à confirmer|· Kinshasa, Congo\.?$/i) ? fallback.text : item.text,
      };
    });
    // Ancien programme du civil (une seule ligne à 11H) → civil à 13H puis bénédiction à 15H
    const civil = value.program.filter((item: Record<string, any>) => item.event === "civil");
    if (civil.length === 1 && civil[0].time === "11H") {
      const at = value.program.indexOf(civil[0]);
      value.program.splice(at, 1, ...defaults.program.filter((p) => p.event === "civil"));
    }
  }

  if (typeof value.heroSubtitle === "string" && value.heroSubtitle.includes("14 février")) {
    value.heroSubtitle = defaults.heroSubtitle;
  }
  if (typeof value.storyText === "string" && value.storyText.includes("la grâce du religieux")) {
    value.storyText = defaults.storyText;
  }
  if (Array.isArray(value.practical)) {
    value.practical = value.practical.map((item: Record<string, any>) =>
      item?.text === "Les trois célébrations auront lieu à Kinshasa, en République démocratique du Congo." ||
      item?.text === "Kinshasa, Congo. Le lieu exact figure sur votre invitation personnelle."
        ? { ...item, text: defaults.practical[0].text }
        : item,
    );
  }
  return value;
}
