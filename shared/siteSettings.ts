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
    religious: eventSettingsSchema,
  }),
  program: z.array(z.object({
    event: z.enum(["customary", "civil", "religious"]),
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
  heroSubtitle: "10, 12 & 14 février 2027 · Kinshasa, RD Congo",
  invitationText: JessicaGeldi.couple.statement,
  storyText: JessicaGeldi.couple.narrative,
  events: eventKeys.reduce((result, key) => {
    const event = weddingEvents[key];
    result[key] = {
      venue: "Lieu à confirmer",
      address: "Kinshasa, RD Congo",
      mapsUrl: "https://maps.google.com/?q=Kinshasa%2C%20RD%20Congo",
      note: event.themeNote,
    };
    return result;
  }, {} as SiteSettings["events"]),
  program: eventKeys.map((key) => ({
    event: key,
    time: weddingEvents[key].time,
    title: weddingEvents[key].label,
    text: `${weddingEvents[key].theme} · lieu à confirmer, Kinshasa.`,
  })),
  contribution: {
    enabled: true,
    title: "Votre présence est notre plus beau cadeau.",
    message: "Pour celles et ceux qui souhaitent nous témoigner une attention, une contribution en espèces pourra se faire directement lors des célébrations.",
  },
  practical: [
    {
      title: "Lieu",
      text: "Les trois célébrations auront lieu à Kinshasa, en République démocratique du Congo.",
    },
  ],
  footerText: JessicaGeldi.couple.statement,
};
