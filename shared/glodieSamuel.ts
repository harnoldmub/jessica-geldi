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
  tagline: "Une celebration lumineuse, familiale et pleine de grace.",
  weddingDate: new Date("2026-07-04T11:00:00+01:00"),
  date: {
    display: "Samedi 04 Juillet 2026",
    iso: "2026-07-04",
    time: "Mariage civil 11h · Benediction nuptiale 13h · Coutumier 20h",
  },
  secondDate: {
    display: "Dimanche 12 Juillet 2026",
    iso: "2026-07-12",
    time: "Soiree dansante 19h30",
  },
  ceremony: {
    blessing: {
      label: "Mariage civil & Benediction nuptiale",
      time: "11h00",
      theme: "Terra Cotta",
      themeNote: "Melange brun, beige et blanc.",
      dress: "Brun, beige et blanc.",
    },
    customary: {
      label: "Mariage coutumier",
      time: "20h00",
      theme: "Celebration traditionnelle",
      themeNote: "Entree des maries a 21h30.",
    },
    evening: {
      label: "Soiree dansante",
      time: "19h30",
      theme: "Blanc & doree",
      themeNote: "Theme de la soiree : blanc et doree.",
      dress: "Blanc et doree.",
    },
  },
  location: "Kinshasa",
  couple: {
    bride: "Glodie",
    groom: "Samuel",
    statement:
      "Nous avons la joie de vous convier a la celebration de notre mariage. Votre presence donnera a ces moments toute leur profondeur, leur grace et leur lumiere.",
    narrative:
      "Le 04 juillet et le 12 juillet, nous celebrerons notre union entoures des personnes qui comptent pour nous. Des instants de foi, de famille, de tradition et de fete a partager avec vous.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "/images/hero.png",
    youtubeId: "",
  },
  story: [
    {
      period: "Glodie & Samuel",
      title: "Une promesse celebree ensemble",
      body: "Nous nous preparons a dire oui devant Dieu, nos familles et les personnes qui nous sont cheres.",
      image: "hero" as null | string,
    },
    {
      period: "La benediction",
      title: "Foi, famille et amour",
      body: "La celebration civile et la benediction nuptiale ouvriront ce chemin dans la priere, la joie et la reconnaissance.",
      image: null as null | string,
    },
    {
      period: "Le coutumier",
      title: "Honorer nos traditions",
      body: "Le mariage coutumier reunira les familles autour des gestes, des symboles et de la joie qui racontent nos racines.",
      image: "coutumier" as null | string,
    },
    {
      period: "La fete",
      title: "Danser la joie",
      body: "La soiree dansante sera le moment de celebrer pleinement cette union, en blanc et doree, avec elegance et bonheur.",
      image: null as null | string,
    },
  ],
  programme: [
    {
      time: "11h00",
      title: "Celebration du mariage",
      body: "Le lieu sera communique d'ici peu.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "13h00",
      title: "Benediction nuptiale & cocktail",
      body: "La benediction nuptiale aura lieu au meme endroit, suivie du cocktail.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "20h00",
      title: "Mariage coutumier",
      body: "Celebration du mariage coutumier.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "21h30",
      title: "Entree des maries",
      body: "Entree officielle de Glodie et Samuel.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "Dimanche 12 juillet · 19h30",
      title: "Arrivee des invites",
      body: "Accueil des invites a la salle Exaudus Arena.",
      theme: "evening" as "blessing" | "evening",
    },
    {
      time: "20h30",
      title: "Entree des maries",
      body: "Entree de Glodie et Samuel pour la soiree dansante.",
      theme: "evening" as "blessing" | "evening",
    },
  ],
  dresscode: {
    blessing: {
      label: "Mariage civil",
      theme: "Terra Cotta",
      description: "Le theme du mariage civil est Terra Cotta : un melange brun, beige et blanc.",
      colors: ["#A65F3B", "#6F3F2A", "#D8C4A8", "#FFFFFF"],
      colorNames: ["Terra cotta", "Brun", "Beige", "Blanc"],
      forbidden: "",
    },
    evening: {
      label: "Mariage religieux & fete",
      theme: "Blanc & doree",
      description: "Pour la fete et la soiree dansante, le theme est blanc et doree.",
      colors: ["#FFFFFF", "#F7F1DE", "#D4AF37", "#FFD700"],
      colorNames: ["Blanc", "Ivoire", "Doree", "Or brillant"],
      forbidden: "",
    },
  },
  venues: [
    {
      label: "Mariage civil & Benediction nuptiale",
      name: "Lieu a communiquer",
      address: "Kinshasa",
      city: "Kinshasa",
      note: "Le lieu sera communique d'ici peu.",
      theme: "blessing" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Kinshasa",
    },
    {
      label: "Soiree dansante",
      name: "Salle Exaudus Arena",
      address: "Avenue Bonga numero 23, croisement avenue du Stade",
      city: "Matonge, commune de Kalamu",
      note: "Reference : en face du marche de Djakarta.",
      theme: "evening" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Avenue+Bonga+23+avenue+du+Stade+Matonge+Kalamu+Kinshasa",
    },
  ],
  cagnotte: {
    title: "Cadeau & Benediction",
    message:
      "Votre presence et vos prieres seront pour nous une immense benediction.\n\nEt pour ceux qui souhaitent nous offrir un cadeau, une boite sera prevue pendant les moments de celebration.",
    iban: "",
    ibanName: "",
    note: "",
  },
  faq: [
    {
      q: "Puis-je venir accompagne(e) ?",
      a: "Votre invitation est personnelle. Si vous souhaitez venir avec un(e) accompagnant(e), merci d'indiquer le nombre de places dans le formulaire RSVP. Chaque place doit etre confirmee.",
    },
    {
      q: "Le dress code est-il strict ?",
      a: "Le mariage civil est sur le theme Terra Cotta : brun, beige et blanc. La fete et la soiree dansante sont sur le theme blanc et doree.",
    },
    {
      q: "A quelle heure dois-je arriver ?",
      a: "Le samedi 04 juillet 2026, le mariage commence a 11h, la benediction a 13h et le coutumier a 20h. Le dimanche 12 juillet 2026, l'arrivee des invites est prevue a 19h30.",
    },
    {
      q: "Comment acceder au lieu ?",
      a: "Le lieu du 04 juillet sera communique d'ici peu. La soiree dansante aura lieu a la salle Exaudus Arena, Avenue Bonga numero 23, croisement avenue du Stade, en face du marche de Djakarta, Matonge, commune de Kalamu.",
    },
    {
      q: "Y a-t-il un espace pour les enfants ?",
      a: "Les enfants sont les bienvenus. Si vous venez avec des enfants, merci de l'indiquer dans le formulaire RSVP afin que nous puissions prevoir l'organisation necessaire.",
    },
    {
      q: "Que faire si je ne peux pas venir ?",
      a: "Votre presence nous tient profondement a coeur. Si vous ne pouvez malheureusement pas etre parmi nous, merci de le signaler via le formulaire RSVP dans les meilleurs delais.",
    },
  ],
};
