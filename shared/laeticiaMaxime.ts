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

export const laeticiaMaxime = {
  brand: "Laeticia & Maxime",
  title: "Laeticia & Maxime",
  tagline: "Une célébration moderne, élégante et profondément familiale.",
  weddingDate: new Date("2026-08-27T10:00:00+02:00"),
  date: {
    display: "Jeudi 27 août 2026",
    iso: "2026-08-27",
    time: "Civil & bénédiction nuptiale",
  },
  secondDate: {
    display: "Samedi 29 août 2026",
    iso: "2026-08-29",
    time: "Soirée dansante",
  },
  ceremony: {
    blessing: {
      label: "Civil & bénédiction nuptiale",
      time: "À confirmer",
      theme: "À l'anglaise",
      themeNote: "Élégance douce, esprit jardin anglais et raffinement classique.",
      dress: "Tenue élégante dans l'esprit à l'anglaise.",
    },
    customary: {
      label: "Bénédiction nuptiale",
      time: "À confirmer",
      theme: "À l'anglaise",
      themeNote: "Civil et bénédiction nuptiale à Saphir Events.",
    },
    evening: {
      label: "Soirée dansante",
      time: "À confirmer",
      theme: "Full Black Chic",
      themeNote: "Une soirée chic, festive et entièrement habillée en noir.",
      dress: "Full Black Chic.",
    },
  },
  location: "Kinshasa",
  couple: {
    bride: "Laeticia",
    groom: "Maxime",
    statement:
      "Nous sommes heureux de célébrer l'amour qui nous unit et de commencer ensemble ce nouveau chapitre de notre vie.",
    narrative:
      "Parfois, les plus belles histoires commencent là où on les attend le moins. La nôtre a débuté lors de l'inauguration du lounge bar de mon grand frère. Une présentation, quelques échanges, un prétexte de décoration pour une boutique de chaussures... et sans le savoir, nous étions en train d'écrire les premières lignes de notre histoire.",
  },
  hero: {
    eyebrow: "Invitation officielle",
    image: "",
    youtubeId: "",
  },
  story: [
    {
      period: "La rencontre",
      title: "Là où on ne l'attendait pas",
      body: "Notre histoire a commencé lors de l'inauguration du lounge bar de mon grand frère : une présentation, quelques échanges, puis ce petit prétexte autour de la décoration d'une boutique de chaussures.",
      image: null as null | string,
    },
    {
      period: "Les premiers mots",
      title: "Les premières lignes",
      body: "Sans vraiment nous en rendre compte, ces instants simples étaient déjà les premières lignes d'une histoire qui allait prendre de la place dans nos vies.",
      image: null as null | string,
    },
    {
      period: "Aujourd'hui",
      title: "Un nouveau chapitre",
      body: "Aujourd'hui, nous sommes heureux de célébrer l'amour qui nous unit et de commencer ensemble ce nouveau chapitre de notre vie.",
      image: null as null | string,
    },
    {
      period: "La fête",
      title: "Danser notre joie",
      body: "Le 29 août, nous prolongerons la célébration dans une soirée dansante chic, élégante et tout en noir.",
      image: null as null | string,
    },
  ],
  programme: [
    {
      time: "Jeudi 27 août",
      title: "Mariage civil",
      body: "Saphir Events, Gombe / Kinshasa.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "Jeudi 27 août",
      title: "Bénédiction nuptiale",
      body: "Saphir Events, Gombe / Kinshasa.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "Samedi 29 août",
      title: "Entrée des mariés",
      body: "Salle Legacy, Gombe / Kinshasa.",
      theme: "evening" as "blessing" | "evening",
    },
    {
      time: "Samedi 29 août",
      title: "Soirée dansante",
      body: "Une célébration festive et chic sur le thème Full Black Chic.",
      theme: "evening" as "blessing" | "evening",
    },
  ],
  dresscode: {
    blessing: {
      label: "Civil & bénédiction",
      theme: "À l'anglaise",
      description: "Pour le civil et la bénédiction nuptiale, le thème est à l'anglaise : élégant, doux, raffiné, avec une palette florale pastel.",
      colors: ["#ADBACE", "#F6F8DB", "#EECA74", "#E5A39D", "#A1AC4E"],
      colorNames: ["Bleu poudré", "Ivoire floral", "Jaune doux", "Rose poudré", "Vert sauge"],
      forbidden: "",
    },
    evening: {
      label: "Soirée dansante",
      theme: "Full Black Chic",
      description: "Pour la soirée dansante du 29 août, le thème est Full Black Chic : une tenue entièrement noire, chic, moderne et élégante.",
      colors: ["#050505", "#111111", "#1C1C1C", "#2A2A2A"],
      colorNames: ["Noir", "Noir profond", "Noir satin", "Noir chic"],
      forbidden: "",
    },
  },
  venues: [
    {
      label: "Civil & bénédiction nuptiale",
      name: "Saphir Events",
      address: "Avenue Uvira 1054, croisement Batetela",
      city: "Gombe / Kinshasa, RDC",
      time: "Horaire à confirmer",
      note: "Référence : en face du parking Pullman.",
      theme: "blessing" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Saphir+Events+Avenue+Uvira+1054+Batetela+Parking+Pullman+Gombe+Kinshasa+RDC",
    },
    {
      label: "Soirée dansante",
      name: "Salle Legacy",
      address: "Accès via le Parking de Galerie La Fontaine, No 9257, croisement des avenues Batetela & Cliniques",
      city: "Gombe / Kinshasa, RDC",
      time: "Horaire à confirmer",
      note: "Lieu de la soirée dansante du 29 août.",
      theme: "evening" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Salle+Legacy+Parking+Galerie+La+Fontaine+9257+Batetela+Cliniques+Gombe+Kinshasa+RDC",
    },
  ],
  cagnotte: {
    title: "Présence & contribution",
    message:
      "Votre présence est notre plus beau cadeau.\n\nNous ne souhaitons pas recevoir de cadeaux matériels. Pour celles et ceux qui désirent nous témoigner une attention, tout se fera en espèces, directement lors des célébrations.",
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
      a: "Le 27 août, le thème du civil et de la bénédiction nuptiale est à l'anglaise. Le 29 août, la soirée dansante est sur le thème Full Black Chic.",
    },
    {
      q: "À quelle heure dois-je arriver ?",
      a: "Les horaires précis seront communiqués sur l'invitation. Les dates à retenir sont le jeudi 27 août 2026 pour le civil et la bénédiction nuptiale, puis le samedi 29 août 2026 pour la soirée dansante.",
    },
    {
      q: "Comment accéder au lieu ?",
      a: "Le civil et la bénédiction nuptiale auront lieu à Saphir Events, Avenue Uvira 1054, croisement Batetela, en face du parking Pullman, Gombe / Kinshasa. La soirée dansante aura lieu à la Salle Legacy, avec accès via le Parking de Galerie La Fontaine, No 9257, croisement des avenues Batetela & Cliniques, Gombe / Kinshasa.",
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
