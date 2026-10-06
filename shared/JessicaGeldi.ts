// Boissons proposées par catégorie (et non plus par marque).
export const beverageCategories = ["Soft", "Bière", "Vin", "Champagne", "Whisky"] as const;

export const eventChoices = ["customary", "civil", "evening"] as const;
export type EventChoice = (typeof eventChoices)[number];
export type WeddingEventKey = EventChoice;

export const weddingEvents: Record<WeddingEventKey, {
  key: WeddingEventKey;
  slug: string;
  label: string;
  shortLabel: string;
  date: string;
  iso: string;
  time: string;
  venue: string;
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
    slug: "coutumier",
    label: "Mariage coutumier",
    shortLabel: "Coutumier",
    date: "Mercredi 10 février 2027",
    iso: "2027-02-10T18:00:00+01:00",
    time: "18H",
    venue: "Pullman Hotel",
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
    slug: "civil",
    label: "Mariage civil & bénédiction",
    shortLabel: "Civil & bénédiction",
    date: "Vendredi 12 février 2027",
    iso: "2027-02-12T11:00:00+01:00",
    time: "11H",
    venue: "Hilton Hotel",
    theme: "Pastel",
    themeNote: "Une palette douce et lumineuse, rose poudré, bleu ciel, lilas et crème.",
    capacity: 200,
    palette: ["#F8D7DA", "#CDE7F0", "#DCC6E8", "#FFF4C7", "#FFFFFF"],
    colorNames: ["Rose", "Bleu ciel", "Lilas", "Crème", "Blanc"],
    accent: "#C88FA0",
    background: "#FFF8FA",
    ink: "#3A2A33",
  },
  evening: {
    key: "evening",
    slug: "soiree",
    label: "Soirée dansante",
    shortLabel: "Soirée",
    date: "Samedi 13 février 2027",
    iso: "2027-02-13T20:00:00+01:00",
    time: "Heure à confirmer",
    venue: "Fleuve Congo Hotel",
    theme: "Chic et Élégant",
    themeNote: "Noir profond, ivoire et touches dorées pour une soirée raffinée.",
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
    return ["customary", "civil", "evening"];
  }
  if (!choice.trim()) return [];
  const keys = choice
    .split(",")
    .map((key) => key.trim())
    .filter((key): key is WeddingEventKey =>
      key === "customary" || key === "civil" || key === "evening",
    );
  return Array.from(new Set(keys));
}

/** L'événement auquel appartient une invitation (une invitation = un seul événement), ou null si elle est à répartir. */
export function getGuestEvent(guest: { invitedCeremonyChoice?: string | null; ceremonyChoice?: string | null }): WeddingEventKey | null {
  const keys = getEventKeys(guest.invitedCeremonyChoice || guest.ceremonyChoice);
  return keys.length === 1 ? keys[0] : null;
}

export function isWeddingEventKey(value: unknown): value is WeddingEventKey {
  return value === "customary" || value === "civil" || value === "evening";
}

export function joinEventKeys(keys: WeddingEventKey[]) {
  return Array.from(new Set(keys)).join(",");
}

export const JessicaGeldi = {
  brand: "Jessica & Geldi",
  title: "Jessica & Geldi",
  tagline: "Trois rendez-vous, trois ambiances, une même promesse d'amour.",
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
      "Notre mariage se vivra en trois temps : la chaleur du coutumier, la douceur du civil et de la bénédiction, puis la fête d'une soirée dansante.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "",
    youtubeId: "",
  },
  story: [
    {
      period: "10 février · Pullman Hotel",
      title: "Mariage coutumier",
      body: "Une ambiance bohème chic, familiale et chaleureuse pour honorer nos traditions.",
      image: null as null | string,
    },
    {
      period: "12 février · Hilton Hotel",
      title: "Mariage civil & bénédiction",
      body: "Une célébration pastel, douce et lumineuse pour officialiser et bénir notre union.",
      image: null as null | string,
    },
    {
      period: "13 février · Fleuve Congo Hotel",
      title: "Soirée dansante",
      body: "Une soirée chic et élégante pour danser et célébrer ensemble jusqu'au bout de la nuit.",
      image: null as null | string,
    },
  ],
  programme: Object.values(weddingEvents).map((event) => ({
    time: `${event.date} · ${event.time}`,
    title: event.label,
    body: `${event.theme} · ${event.venue}, Kinshasa.`,
    theme: event.key,
  })),
  dresscode: weddingEvents,
  venues: Object.values(weddingEvents).map((event) => ({
    label: event.label,
    name: event.venue,
    address: "Kinshasa",
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
      a: "Le coutumier est Bohème chic, le civil et la bénédiction Pastel, la soirée dansante Chic et Élégant.",
    },
    {
      q: "Quels sont les horaires ?",
      a: "Le coutumier aura lieu le mercredi 10 février 2027 au Pullman Hotel, le civil et la bénédiction le vendredi 12 février 2027 au Hilton Hotel, et la soirée dansante le samedi 13 février 2027 au Fleuve Congo Hotel.",
    },
    {
      q: "Puis-je venir accompagné(e) ?",
      a: "Votre invitation précise le nombre de places prévues. Merci de confirmer votre présence via le RSVP afin que l'organisation soit exacte.",
    },
  ],
};
