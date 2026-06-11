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

export const glodieSamuel = {
  brand: "Glodie & Samuel",
  title: "Glodie & Samuel",
  tagline: "Une célébration lumineuse, familiale et pleine de grâce.",
  weddingDate: new Date("2026-07-04T10:30:00+01:00"),
  date: {
    display: "Samedi 04 Juillet 2026",
    iso: "2026-07-04",
    time: "Mariage civil 10h30 · Coutumier 19h",
  },
  secondDate: {
    display: "Dimanche 12 Juillet 2026",
    iso: "2026-07-12",
    time: "Mariage religieux 19h30",
  },
  ceremony: {
    blessing: {
      label: "Mariage civil",
      time: "10h30",
      theme: "Terra Cotta",
      themeNote: "Mélange brun, beige et blanc.",
      dress: "Brun, beige et blanc.",
    },
    customary: {
      label: "Mariage coutumier",
      time: "19h00",
      theme: "Célébration traditionnelle",
      themeNote: "Célébration du mariage coutumier à 19h.",
    },
    evening: {
      label: "Mariage religieux",
      time: "19h30",
      theme: "Blanc & doré",
      themeNote: "Thème de la soirée : blanc et doré.",
      dress: "Blanc et doré.",
    },
  },
  location: "Kinshasa",
  couple: {
    bride: "Glodie",
    groom: "Samuel",
    statement:
      "Nous avons la joie de vous convier à la célébration de notre mariage. Votre présence donnera à ces moments toute leur profondeur, leur grâce et leur lumière.",
    narrative:
      "Le 04 juillet et le 12 juillet, nous célébrerons notre union entourés des personnes qui comptent pour nous. Des instants de foi, de famille, de tradition et de fête à partager avec vous.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "/images/hero.png",
    youtubeId: "",
  },
  story: [
    {
      period: "Glodie & Samuel",
      title: "Une promesse célébrée ensemble",
      body: "Nous nous préparons à dire oui devant Dieu, nos familles et les personnes qui nous sont chères.",
      image: "hero" as null | string,
    },
    {
      period: "Le religieux",
      title: "Foi, famille et amour",
      body: "Le mariage religieux prolongera ce chemin dans la prière, la joie et la reconnaissance.",
      image: null as null | string,
    },
    {
      period: "Le coutumier",
      title: "Honorer nos traditions",
      body: "Le mariage coutumier réunira les familles autour des gestes, des symboles et de la joie qui racontent nos racines.",
      image: "coutumier" as null | string,
    },
    {
      period: "La fête",
      title: "Danser la joie",
      body: "La fête sera le moment de célébrer pleinement cette union, en blanc et doré, avec élégance et bonheur.",
      image: null as null | string,
    },
  ],
  programme: [
    {
      time: "10h30",
      title: "Célébration du mariage civil",
      body: "Le lieu sera communiqué d'ici peu.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "19h00",
      title: "Mariage coutumier",
      body: "Célébration du mariage coutumier.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "Dimanche 12 juillet · 19h30",
      title: "Mariage religieux",
      body: "Célébration du mariage religieux à la salle Exaudus Arena.",
      theme: "evening" as "blessing" | "evening",
    },
    {
      time: "20h30",
      title: "Entrée des mariés",
      body: "Entrée de Glodie et Samuel pour la fête.",
      theme: "evening" as "blessing" | "evening",
    },
  ],
  dresscode: {
    blessing: {
      label: "Mariage civil",
      theme: "Terra Cotta",
      description: "Le thème du mariage civil est Terra Cotta : un mélange brun, beige et blanc.",
      colors: ["#A65F3B", "#6F3F2A", "#D8C4A8", "#FFFFFF"],
      colorNames: ["Terra cotta", "Brun", "Beige", "Blanc"],
      forbidden: "",
    },
    evening: {
      label: "Mariage religieux & fête",
      theme: "Blanc & doré",
      description: "Pour le mariage religieux et la fête, le thème est blanc et doré.",
      colors: ["#FFFFFF", "#F7F1DE", "#D4AF37", "#FFD700"],
      colorNames: ["Blanc", "Ivoire", "Doré", "Or brillant"],
      forbidden: "",
    },
  },
  venues: [
    {
      label: "Mariage civil",
      name: "Lieu à communiquer",
      address: "Kinshasa",
      city: "Kinshasa",
      note: "Le lieu sera communiqué d'ici peu.",
      theme: "blessing" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Kinshasa",
    },
    {
      label: "Mariage religieux & fête",
      name: "Salle Exaudus Arena",
      address: "Avenue Bonga numéro 23, croisement avenue du Stade",
      city: "Matonge, commune de Kalamu",
      note: "Référence : en face du marché de Djakarta.",
      theme: "evening" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Avenue+Bonga+23+avenue+du+Stade+Matonge+Kalamu+Kinshasa",
    },
  ],
  cagnotte: {
    title: "Cadeau & Bénédiction",
    message:
      "Votre présence et vos prières seront pour nous une immense bénédiction.\n\nEt pour ceux qui souhaitent nous offrir un cadeau, une boîte sera prévue pendant les moments de célébration.",
    iban: "",
    ibanName: "",
    note: "",
  },
  faq: [
    {
      q: "Puis-je venir accompagné(e) ?",
      a: "Votre invitation est personnelle. Si vous souhaitez venir avec un(e) accompagnant(e), merci d'indiquer le nombre de places dans le formulaire RSVP. Chaque place doit être confirmée.",
    },
    {
      q: "Le dress code est-il strict ?",
      a: "Le mariage civil est sur le thème Terra Cotta : brun, beige et blanc. La fête et la soirée dansante sont sur le thème blanc et doré.",
    },
    {
      q: "À quelle heure dois-je arriver ?",
      a: "Le samedi 04 juillet 2026, le mariage civil commence à 10h30 et le mariage coutumier à 19h. Le dimanche 12 juillet 2026, le mariage religieux est prévu à 19h30.",
    },
    {
      q: "Comment accéder au lieu ?",
      a: "Le lieu du 04 juillet sera communiqué d'ici peu. La soirée dansante aura lieu à la salle Exaudus Arena, Avenue Bonga numéro 23, croisement avenue du Stade, en face du marché de Djakarta, Matonge, commune de Kalamu.",
    },
    {
      q: "Y a-t-il un espace pour les enfants ?",
      a: "Les enfants sont les bienvenus. Si vous venez avec des enfants, merci de l'indiquer dans le formulaire RSVP afin que nous puissions prévoir l'organisation nécessaire.",
    },
    {
      q: "Que faire si je ne peux pas venir ?",
      a: "Votre présence nous tient profondément à cœur. Si vous ne pouvez malheureusement pas être parmi nous, merci de le signaler via le formulaire RSVP dans les meilleurs délais.",
    },
  ],
};
