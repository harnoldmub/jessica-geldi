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

export const eventChoices = ["customary", "civil", "religious"] as const;
export type EventChoice = (typeof eventChoices)[number];
export type WeddingEventKey = EventChoice;

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
    date: "Mercredi 10 février 2027",
    iso: "2027-02-10T18:00:00+01:00",
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
    date: "Vendredi 12 février 2027",
    iso: "2027-02-12T11:00:00+01:00",
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
    date: "Dimanche 14 février 2027",
    iso: "2027-02-14T11:00:00+01:00",
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
};

export function getEventKeys(choice?: string | null): WeddingEventKey[] {
  if (choice == null || choice === "all" || choice === "both") {
    return ["customary", "civil", "religious"];
  }
  if (!choice.trim()) return [];
  if (choice === "evening") return [];
  const keys = choice
    .split(",")
    .map((key) => key.trim())
    .filter((key): key is WeddingEventKey =>
      key === "customary" || key === "civil" || key === "religious",
    );
  return Array.from(new Set(keys));
}

export function joinEventKeys(keys: WeddingEventKey[]) {
  return Array.from(new Set(keys)).join(",");
}

export const JessicaGeldi = {
  brand: "Jessica & Geldi",
  title: "Jessica & Geldi",
  tagline: "Trois célébrations, trois ambiances, une même promesse d'amour.",
  weddingDate: new Date(weddingEvents.customary.iso),
  date: {
    display: weddingEvents.customary.date,
    iso: "2027-02-10",
    time: "Coutumier à 18H",
  },
  secondDate: {
    display: weddingEvents.civil.date,
    iso: "2027-02-12",
    time: "Civil à 11H",
  },
  ceremony: weddingEvents,
  location: "Kinshasa",
  couple: {
    bride: "Jessica",
    groom: "Geldi",
    statement:
      "Nous serons heureux de vous compter parmi nous pour célébrer notre union, entourés de nos familles et de ceux que nous aimons.",
    narrative:
      "Notre mariage se vivra en trois temps: la chaleur du coutumier, la douceur du civil et la grâce du religieux.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "",
    youtubeId: "",
  },
  story: [
    {
      period: "10 février · 18H",
      title: "Mariage coutumier",
      body: "Une ambiance bohème chic, familiale et chaleureuse pour honorer nos traditions.",
      image: null as null | string,
    },
    {
      period: "12 février · 11H",
      title: "Mariage civil",
      body: "Une célébration pastel, douce et lumineuse pour officialiser notre union.",
      image: null as null | string,
    },
    {
      period: "14 février · 11H",
      title: "Mariage religieux",
      body: "Un moment chic et élégant pour recevoir la bénédiction et célébrer notre foi.",
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
      a: "Le coutumier est Bohème chic, le civil Pastel et le religieux Chic et Élégant.",
    },
    {
      q: "Quels sont les horaires ?",
      a: "Le coutumier aura lieu le 10 février 2027 à 18H, le civil le 12 février 2027 à 11H et le religieux le 14 février 2027 à 11H.",
    },
    {
      q: "Puis-je venir accompagné(e) ?",
      a: "Votre invitation précise le nombre de places prévues. Merci de confirmer votre présence via le RSVP afin que l'organisation soit exacte.",
    },
  ],
};
