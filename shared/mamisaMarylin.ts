export const mamisaMarylin = {
  brand: "Mamisa & Marylin",
  title: "Mamisa & Marylin",
  tagline: "Une célébration sobre, tendre et colorée.",
  weddingDate: new Date("2026-07-25T10:00:00+02:00"),
  date: {
    display: "Samedi 25 Juillet 2026",
    iso: "2026-07-25",
    time: "Mariage civil le matin · Cérémonie religieuse le soir",
  },
  ceremony: {
    blessing: {
      label: "Mariage civil",
      time: "09h00",
      theme: "Color",
      themeNote: "Rose, orange, vert, etc.",
      dress: "Rose, orange, vert, etc.",
    },
    evening: {
      label: "Soirée dansante",
      time: "18h30",
      theme: "Glamour",
      themeNote: "Noir, rouge, dorée",
      dress: "Noir, rouge, dorée",
    },
  },
  location: "Kinshasa",
  couple: {
    bride: "Mamisa",
    groom: "Marylin",
    statement:
      "Nous avons la joie de vous convier à la célébration de notre mariage. Votre présence donnera à cette journée toute sa profondeur, sa grâce et sa lumière.",
    narrative:
      "Le 25 juillet, nous célébrerons notre union entourés des personnes qui comptent pour nous. Une journée simple, belle et colorée, à partager avec vous.",
  },
  hero: {
    eyebrow: "Invitation officielle · Kinshasa",
    image: "/images/hero.jpeg",
    youtubeId: "",
  },
  story: [
    {
      period: "Notre union",
      title: "Une journée pensée pour rassembler",
      body: "Mamisa et Marylin souhaitent vivre cette célébration dans la joie, la foi et la simplicité, entourés de leurs familles et de leurs proches.",
      image: null as null | string,
    },
    {
      period: "Le matin",
      title: "Le mariage civil",
      body: "La journée commencera par le mariage civil, un moment intime et officiel pour marquer le premier temps fort de cette union.",
      image: "hero" as null | string,
    },
    {
      period: "Le soir",
      title: "La soirée dansante",
      body: "Le soir, la fête réunira tous les invités dans une atmosphère chaleureuse, lumineuse et colorée.",
      image: null as null | string,
    },
  ],
  programme: [
    {
      time: "09h00",
      title: "Mariage civil",
      body: "Union civile de Mamisa et Marylin, entourés de leurs proches.",
      theme: "blessing" as "blessing" | "evening",
    },
    {
      time: "18h30",
      title: "Soirée dansante",
      body: "Place à la joie, à la musique et à la danse pour célébrer cette belle journée.",
      theme: "evening" as "blessing" | "evening",
    },
  ],
  dresscode: {
    blessing: {
      label: "Mariage civil",
      theme: "Color",
      description: "Le thème de la journée est coloré : rose, orange, vert, etc.",
      colors: ["#E8B4B8", "#E2856E", "#7A8B76"],
      colorNames: ["Rose poudré", "Terracotta", "Vert sauge"],
      forbidden: "",
    },
    evening: {
      label: "Soirée dansante",
      theme: "Glamour",
      description: "Le thème de la soirée est glamour : noir, rouge et dorée.",
      colors: ["#111111", "#8B0000", "#B89B72"],
      colorNames: ["Noir profond", "Rouge intense", "Or Champagne"],
      forbidden: "",
    },
  },
  venues: [
    {
      label: "Mariage civil",
      name: "GB Oua, Ex shoprite au jardin",
      address: "GB Oua",
      city: "Kinshasa",
      note: "Le mariage civil aura lieu dans ce cadre magnifique.",
      theme: "blessing" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Kinshasa+GB+Oua",
    },
    {
      label: "Soirée dansante",
      name: "GB Oua, Ex shoprite au jardin",
      address: "GB Oua",
      city: "Kinshasa",
      note: "La soirée dansante se poursuivra au même endroit.",
      theme: "evening" as "blessing" | "evening",
      mapsUrl: "https://maps.google.com/?q=Kinshasa+GB+Oua",
    },
  ],
  cagnotte: {
    title: "Cadeau & Bénédiction",
    message:
      "Votre présence et vos prières seront pour nous une immense bénédiction ❤️\n\nEt pour ceux qui souhaitent nous offrir un cadeau, une boîte transparente sera placée près des mariés pendant le moment de célébration et de danse. Vous pourrez y déposer en toute simplicité et dans la joie de partager ce beau moment avec nous.",
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
      a: "Non. Le thème de la soirée est coloré autour du bleu pâle, du jaune et du rose, mais chacun reste libre de porter ce qui lui semble bien.",
    },
    {
      q: "À quelle heure dois-je arriver ?",
      a: "Le mariage civil aura lieu le matin et la cérémonie religieuse le soir. Les horaires détaillés seront communiqués avec votre invitation.",
    },
    {
      q: "Comment accéder au lieu ?",
      a: "L'adresse exacte du lieu vous sera communiquée avec votre invitation personnelle. Pour toute question sur l'accès, contactez-nous directement.",
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
  gallery: [
    {
      src: "hero",
      alt: "Mamisa & Marylin",
      caption: "Mamisa & Marylin.",
    },
  ],
};
