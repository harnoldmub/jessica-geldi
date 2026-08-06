export const beverageOptions = {
  beers: [
    "Nkoyi Likofi",
    "Nkoyi normal",
    "Beaufort",
    "Castel",
    "Heineken",
    "Primus",
    "Tembo",
    "Savanna",
  ],
  softDrinks: [
    "Coca",
    "Fanta",
    "Maltina",
    "Sprite",
    "Energy malt",
    "Vitalo",
  ],
};

export const allBeverageOptions = [
  ...beverageOptions.beers,
  ...beverageOptions.softDrinks,
] as const;

export const eventChoices = ["customary", "civil", "religious", "reception", "all"] as const;
export type EventChoice = (typeof eventChoices)[number];
export type WeddingEventKey = Exclude<EventChoice, "all">;

export const weddingEvents: Record<WeddingEventKey, {
  key: WeddingEventKey;
  label: string;
  shortLabel: string;
  date: string;
  iso: string;
  time: string;
  theme: string;
  themeNote: string;
  capacity: number;
  palette: string[];
  colorNames: string[];
  accent: string;
  background: string;
  ink: string;
}> = {
  customary: {
    key: "customary",
    label: "Mariage coutumier",
    shortLabel: "Coutumier",
    date: "Mercredi 11 février 2026",
    iso: "2026-02-11T18:00:00+01:00",
    time: "18H",
    theme: "Bohème chic",
    themeNote: "Matières naturelles, touches terracotta, ivoire et esprit floral libre.",
    capacity: 400,
    palette: ["#F4E7D5", "#B66E4B", "#D8A677", "#7E8A63", "#FFFFFF"],
    colorNames: ["Ivoire", "Terracotta", "Argile", "Sauge", "Blanc"],
    accent: "#B66E4B",
    background: "#FBF4EA",
    ink: "#3B261F",
  },
  civil: {
    key: "civil",
    label: "Mariage civil",
    shortLabel: "Civil",
    date: "Mercredi 11 février 2026",
    iso: "2026-02-11T11:00:00+01:00",
    time: "11H",
    theme: "Pastel",
    themeNote: "Une palette douce et lumineuse, rose poudré, bleu ciel, lilas et crème.",
    capacity: 200,
    palette: ["#F8D7DA", "#CDE7F0", "#DCC6E8", "#FFF4C7", "#FFFFFF"],
    colorNames: ["Rose", "Bleu ciel", "Lilas", "Crème", "Blanc"],
    accent: "#C88FA0",
    background: "#FFF8FA",
    ink: "#3A2A33",
  },
  religious: {
    key: "religious",
    label: "Mariage religieux",
    shortLabel: "Religieux",
    date: "Vendredi 13 février 2026",
    iso: "2026-02-13T11:00:00+01:00",
    time: "11H",
    theme: "Chic et Élégant",
    themeNote: "Noir profond, ivoire et touches dorées pour une cérémonie solennelle et raffinée.",
    capacity: 200,
    palette: ["#111111", "#F7F0E6", "#C9A45C", "#6F7277", "#FFFFFF"],
    colorNames: ["Noir", "Ivoire", "Or", "Gris chic", "Blanc"],
    accent: "#C9A45C",
    background: "#F8F5EF",
    ink: "#171717",
  },
  reception: {
    key: "reception",
    label: "Soirée dansante",
    shortLabel: "Soirée",
    date: "Vendredi 13 février 2026",
    iso: "2026-02-13T19:00:00+01:00",
    time: "19H",
    theme: "Chic festif",
    themeNote: "Une soirée élégante, dorée et lumineuse pour danser jusqu'au bout de la fête.",
    capacity: 600,
    palette: ["#080808", "#221A16", "#D5B36A", "#F8EEDB", "#FFFFFF"],
    colorNames: ["Noir", "Brun nuit", "Or", "Champagne", "Blanc"],
    accent: "#D5B36A",
    background: "#0A0908",
    ink: "#F8EEDB",
  },
};

export function getEventKeys(choice?: string | null): WeddingEventKey[] {
  if (!choice || choice === "all" || choice === "both") {
    return ["customary", "civil", "religious", "reception"];
  }
  if (choice === "evening") return ["reception"];
  if (choice === "customary" || choice === "civil" || choice === "religious" || choice === "reception") {
    return [choice];
  }
  return ["customary", "civil", "religious", "reception"];
}

export const JessicaGeldi = {
  brand: "Jessica & Geldi",
  title: "Jessica & Geldi",
  tagline: "Quatre célébrations, quatre ambiances, une même promesse d'amour.",
  weddingDate: new Date(weddingEvents.civil.iso),
  date: {
    display: weddingEvents.civil.date,
    iso: "2026-02-11",
    time: "Civil à 11H · Coutumier à 18H",
  },
  secondDate: {
    display: weddingEvents.religious.date,
    iso: "2026-02-13",
    time: "Religieux à 11H · Soirée à 19H",
  },
  ceremony: weddingEvents,
  location: "Kinshasa",
  couple: {
    bride: "Jessica",
    groom: "Geldi",
    statement:
      "Nous serons heureux de vous compter parmi nous pour célébrer notre union, entourés de nos familles et de ceux que nous aimons.",
    narrative:
      "Notre mariage se vivra en plusieurs temps: la chaleur du coutumier, la douceur du civil, la grâce du religieux et la joie de la soirée dansante.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "",
    youtubeId: "",
  },
  story: [
    {
      period: "11 février · 11H",
      title: "Mariage civil",
      body: "Une célébration pastel, douce et lumineuse pour officialiser notre union.",
      image: null as null | string,
    },
    {
      period: "11 février · 18H",
      title: "Mariage coutumier",
      body: "Une ambiance bohème chic, familiale et chaleureuse pour honorer nos traditions.",
      image: null as null | string,
    },
    {
      period: "13 février · 11H",
      title: "Mariage religieux",
      body: "Un moment chic et élégant pour recevoir la bénédiction et célébrer notre foi.",
      image: null as null | string,
    },
    {
      period: "13 février · 19H",
      title: "Soirée dansante",
      body: "Une soirée festive et raffinée pour partager la joie, la musique et la danse.",
      image: null as null | string,
    },
  ],
  programme: Object.values(weddingEvents).map((event) => ({
    time: `${event.date} · ${event.time}`,
    title: event.label,
    body: `${event.theme} · lieu à confirmer.`,
    theme: event.key,
  })),
  dresscode: weddingEvents,
  venues: Object.values(weddingEvents).map((event) => ({
    label: event.label,
    name: "Lieu à confirmer",
    address: "Adresse à confirmer",
    city: "Kinshasa",
    time: `${event.date} · ${event.time}`,
    note: event.themeNote,
    theme: event.key,
    mapsUrl: "https://maps.google.com/?q=Kinshasa",
  })),
  cagnotte: {
    title: "Présence & contribution",
    message:
      "Votre présence est notre plus beau cadeau.\n\nPour celles et ceux qui souhaitent nous témoigner une attention, une contribution en espèces pourra se faire directement lors des célébrations.",
    iban: "",
    ibanName: "",
    note: "",
  },
  faq: [
    {
      q: "À quelles célébrations suis-je invité(e) ?",
      a: "Votre lien personnalisé affiche uniquement les invitations prévues pour vous. Certains invités peuvent être conviés à une seule célébration, d'autres à plusieurs.",
    },
    {
      q: "Quels sont les thèmes ?",
      a: "Le coutumier est Bohème chic, le civil Pastel, le religieux Chic et Élégant, et la soirée dansante Chic festif.",
    },
    {
      q: "Quels sont les horaires ?",
      a: "Le civil aura lieu le 11 février à 11H, le coutumier le 11 février à 18H, le religieux le 13 février à 11H et la soirée dansante le 13 février à 19H.",
    },
    {
      q: "Puis-je venir accompagné(e) ?",
      a: "Votre invitation précise le nombre de places prévues. Merci de confirmer votre présence via le RSVP afin que l'organisation soit exacte.",
    },
  ],
};
