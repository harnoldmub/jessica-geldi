import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Clock, MapPin, ChevronDown, ExternalLink, Plus, Minus, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laeticiaMaxime } from "@shared/laeticiaMaxime";
import RsvpForm from "@/components/RsvpForm";
import Countdown from "@/components/Countdown";

import heroVideo from "../../images/hero-video.mp4";
import logoBlack from "../../images/logo-lm-black.png";
import logoWhite from "../../images/logo-lm-white.png";
import gardenWideImg from "../../images/couple-garden-wide.jpg";
import gardenEmbraceImg from "../../images/couple-garden-embrace.jpg";
import gardenSeatedImg from "../../images/couple-garden-seated.jpg";
import blackStandingImg from "../../images/couple-black-walkway-standing.jpg";
import blackBenchImg from "../../images/couple-black-bench.jpg";
import blackCloseImg from "../../images/couple-black-close-portrait.jpg";
import redStaircasePortraitImg from "../../images/couple-red-staircase-portrait.jpg";
import redPianoWideImg from "../../images/couple-red-piano-wide.jpg";

const rv = { duration: 1.05, ease: [0.22, 1, 0.36, 1] as const };

const storyImages = [
  { main: gardenWideImg, accent: gardenEmbraceImg, alt: "Laeticia et Maxime au jardin" },
  { main: gardenSeatedImg, accent: blackStandingImg, alt: "Laeticia et Maxime en tenue elegante" },
  { main: redStaircasePortraitImg, accent: redPianoWideImg, alt: "Laeticia et Maxime dans le decor rouge" },
  { main: blackBenchImg, accent: blackCloseImg, alt: "Laeticia et Maxime en ambiance noire" },
];

/* ─── Capacity blocks ─────────────────────────────────────── */
function CapacityBlocks() {
  const { data: cap } = useQuery<{ civil: number; civilMax: number; evening: number; eveningMax: number }>({
    queryKey: ["/api/capacity"],
    staleTime: 30_000,
  });
  const events = [
    {
      key: "civil",
      title: "Civil & bénédiction nuptiale",
      time: laeticiaMaxime.date.display,
      place: "Saphir Events, Gombe / Kinshasa",
      theme: laeticiaMaxime.dresscode.blessing.theme,
    },
    {
      key: "evening",
      title: "Soirée dansante",
      time: laeticiaMaxime.secondDate.display,
      place: "Salle Legacy, Gombe / Kinshasa",
      theme: laeticiaMaxime.dresscode.evening.theme,
    },
  ];
  return (
    <div className="space-y-5">
      {events.map((e) => {
        const isCivil = e.key === "civil";
        const full = cap ? (isCivil ? cap.civil >= cap.civilMax : cap.evening >= cap.eveningMax) : false;
        return (
          <div key={e.key} className="border-l-2 border-border pl-5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground/60">{e.title}</p>
              {full && (
                <span className="text-[8px] uppercase tracking-[0.3em] bg-rose-100 text-rose-600 px-2 py-0.5">
                  Complet
                </span>
              )}
            </div>
            <p className="mt-1 font-serif text-lg text-foreground">{e.time} · {e.place}</p>
            <p className="text-[10px] italic text-muted-foreground">{e.theme}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Ornamental rule ─────────────────────────────────────── */
function Rule({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ opacity }}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
      <span className="text-sm text-primary">✦</span>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
    </div>
  );
}

/* ─── Section label ───────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.68em] text-primary">
      {children}
    </p>
  );
}

/* ─── FAQ item ────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-serif text-lg pr-8 text-foreground">{q}</span>
        <span className="shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "none" }}>
          {open
            ? <Minus className="h-4 w-4 text-muted-foreground" strokeWidth={1.4} />
            : <Plus className="h-4 w-4 text-muted-foreground" strokeWidth={1.4} />
          }
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-base leading-8 text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={heroVideo} type="video/mp4" />
    </video>
  );
}

function StoryPhotos({ main, accent, alt, reverse = false }: { main: string; accent: string; alt: string; reverse?: boolean }) {
  return (
    <div className="relative min-h-[430px] md:min-h-[520px]">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute top-0 ${reverse ? "left-0" : "right-0"} h-[78%] w-[78%] overflow-hidden bg-[#120b0d] editorial-shadow`}
      >
        <img src={main} alt={alt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/32 via-transparent to-transparent" />
        <div className="absolute inset-4 border border-white/16" />
      </motion.div>
      <motion.div
        whileHover={{ y: -4, rotate: reverse ? -1.5 : 1.5 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute bottom-0 ${reverse ? "right-0" : "left-0"} h-[46%] w-[48%] overflow-hidden border-[10px] border-background bg-[#120b0d] shadow-2xl`}
      >
        <img src={accent} alt={alt} className="h-full w-full object-cover" />
      </motion.div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "18%"]);

  const weddingDate = laeticiaMaxime.weddingDate;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════════════════
          1 · HÉROS — vidéo éditoriale
      ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#120b0d]">

        {/* ── MOBILE : vidéo en fond plein écran ── */}
        <div className="absolute inset-0 pointer-events-none md:hidden overflow-hidden">
          <HeroVideo />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#2b060b]/15 to-black/86" />
        </div>

        {/* ── DESKTOP : layout côte à côte ── */}
        <div className="hidden md:flex h-full">

          {/* Gauche — contenu */}
          <motion.div
            style={{
              y: heroY,
              opacity: heroOpacity,
            }}
              className="relative flex flex-1 flex-col justify-center px-14 lg:px-20 bg-[#f8f1e8]"
            >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(128,22,37,0.16) 0%, transparent 44%), radial-gradient(ellipse at 12% 10%, rgba(129,141,111,0.14) 0%, transparent 42%)" }} />

            <motion.img
              src={logoBlack}
              alt="Logo Laeticia & Maxime"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-8 h-20 w-20 object-contain"
            />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-[10px] uppercase tracking-[0.68em] text-foreground/50"
            >
              {laeticiaMaxime.hero.eyebrow}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-script leading-none text-foreground"
              style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)" }}
            >
              {laeticiaMaxime.title}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.45 }}
              className="mt-4 font-serif text-xl text-foreground/60"
            >
              vous invitent à leur mariage
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-3 inline-flex w-fit border border-[#7d1f30]/20 bg-white/60 px-4 py-2 text-[11px] uppercase tracking-[0.38em] text-foreground/80"
            >
              {laeticiaMaxime.date.display} · {laeticiaMaxime.secondDate.display}
            </motion.p>

            {/* Separator */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.75 }}
              className="mt-8 h-px w-16 origin-left bg-border"
            />

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.85 }}
              className="mt-8"
            >
              <Countdown target={weddingDate} />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.05 }}
              className="mt-10"
            >
              <a
                href="#rsvp"
                className="inline-flex items-center px-8 py-4 text-[10px] uppercase tracking-[0.45em] transition-all border border-foreground/30 text-foreground bg-foreground/5 hover:bg-foreground/10"
              >
                Confirmer ma présence
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9 }}
              className="mt-14"
            >
              <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground/60" strokeWidth={1.3} />
            </motion.div>
          </motion.div>

          {/* Droite — vidéo 9:16 pleine hauteur */}
          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{ width: "calc(100svh * 9 / 16)" }}
          >
            <HeroVideo />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            <div className="absolute inset-8 border border-white/16" />
            <div
              className="absolute inset-y-0 left-0 w-28 pointer-events-none bg-gradient-to-r from-[#f8f1e8] to-transparent"
            />
          </div>
        </div>

        {/* ── MOBILE : contenu en bas ── */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center text-white md:hidden"
        >
          <img src={logoWhite} alt="Logo Laeticia & Maxime" className="mb-5 h-20 w-20 object-contain" />
          <p className="text-[10px] uppercase tracking-[0.68em] text-white/50">
            {laeticiaMaxime.hero.eyebrow}
          </p>
          <p className="mt-5 font-script text-white leading-none" style={{ fontSize: "clamp(3.5rem,14vw,5.5rem)" }}>
            {laeticiaMaxime.title}
          </p>
          <p className="mt-4 border border-white/25 bg-[#7d1f30]/45 px-4 py-2 font-serif text-base text-white shadow-xl backdrop-blur-sm">
            {laeticiaMaxime.date.display} · {laeticiaMaxime.secondDate.display}
          </p>
          <div className="mt-6">
            <Countdown target={weddingDate} dark />
          </div>
          <a
            href="#rsvp"
            className="mt-7 inline-flex items-center px-7 py-4 text-[10px] uppercase tracking-[0.45em] text-white border border-white/30 bg-white/10 backdrop-blur-md"
          >
            Confirmer ma présence
          </a>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2 · RSVP — Ultra important
      ══════════════════════════════════════════════════════ */}
      <section id="rsvp" className="relative overflow-hidden bg-[#f8f1e8]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_18%_0%,rgba(125,31,48,0.16),transparent_42%),radial-gradient(ellipse_at_88%_88%,rgba(199,185,154,0.32),transparent_46%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c7b99a] to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-24 md:px-10 md:py-28 lg:grid-cols-[1fr_1.5fr]">

          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={rv} className="space-y-8 text-[#281118]">
            <div>
              <Label>RSVP</Label>
              <h2 className="mt-5 font-serif leading-tight text-[#281118]" style={{ fontSize: "clamp(2rem,4.5vw,3rem)" }}>
                Confirmez votre présence.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#7b4d4f]">Une réponse simple suffit : dites-nous si vous serez là, choisissez la célébration et ajoutez vos préférences.</p>
            </div>

            <CapacityBlocks />

          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ ...rv, delay: 0.1 }}>
            <RsvpForm
              variant="invitation"
              title="Répondre à l'invitation"
              description="Dites-nous simplement si vous venez. Si oui, choisissez seul(e) ou en couple, votre date de présence et votre boisson souhaitée."
              submitLabel="Envoyer ma réponse"
              successDescription="Merci. Votre réponse a bien été enregistrée. Nous avons hâte de vous accueillir."
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3 · NOTRE HISTOIRE — Timeline
      ══════════════════════════════════════════════════════ */}
      <section id="histoire" className="relative overflow-hidden bg-gradient-to-br from-background to-secondary">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv} className="mb-20 text-center">
            <Label>Notre histoire</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
              Une histoire célébrée à deux
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block bg-gradient-to-b from-transparent via-border to-transparent" />

            <div className="space-y-16 md:space-y-24">
              {laeticiaMaxime.story.map((chapter, i) => (
                <motion.div
                  key={chapter.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ ...rv, delay: i * 0.06 }}
                  className={`grid gap-8 md:grid-cols-2 md:gap-14 md:items-center ${i % 2 !== 0 ? "md:[&>*:first-child]:order-2" : ""}`}
                >
                  {/* Text side */}
                  <div className={`space-y-4 ${i % 2 !== 0 ? "md:text-right" : ""}`}>
                    <div className={`flex items-center gap-3 ${i % 2 !== 0 ? "md:justify-end" : ""}`}>
                      <div className="h-px w-8 bg-border" />
                      <p className="text-[9px] uppercase tracking-[0.52em] text-muted-foreground">{chapter.period}</p>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl text-foreground">{chapter.title}</h3>
                    <p className="text-base leading-8 text-muted-foreground">{chapter.body}</p>
                  </div>

                  <StoryPhotos {...storyImages[i % storyImages.length]} reverse={i % 2 !== 0} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4 · PROGRAMME — Timeline du jour
      ══════════════════════════════════════════════════════ */}
      <section id="programme" className="relative overflow-hidden bg-muted">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv} className="mb-16 text-center">
            <Label>27 août & 29 août 2026</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3.25rem)" }}>
              Programme de la journée
            </h2>
          </motion.div>

          <div className="relative pl-8 md:pl-12">
            {/* Vertical line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-border to-transparent" />

            <div className="space-y-10">
              {laeticiaMaxime.programme.map((event, i) => (
                <motion.div
                  key={`${event.time}-${event.title}`}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ ...rv, delay: i * 0.07 }}
                  className="relative flex gap-6"
                >
                  {/* Dot */}
                  <div
                    className="absolute -left-[2.1rem] md:-left-[3.1rem] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background"
                  />
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <p className="font-serif text-lg text-foreground">
                        {event.time}
                      </p>
                      <span className="text-[8px] uppercase tracking-[0.5em] px-2 py-0.5 text-primary border border-primary/30">
                        {event.theme === "blessing" ? "27 août" : "29 août"}
                      </span>
                    </div>
                    <p className="font-serif text-2xl text-foreground">{event.title}</p>
                    <p className="text-sm leading-7 text-muted-foreground">{event.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5 · LIEUX & ACCÈS
      ══════════════════════════════════════════════════════ */}
      <section id="lieux" className="relative overflow-hidden bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv} className="mb-14 text-center">
            <Label>Kinshasa, RDC</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3.25rem)" }}>
              Lieux &amp; Accès
            </h2>
            <p className="mt-4 text-sm italic text-muted-foreground">
              Deux lieux à retenir : Saphir Events pour le civil et la bénédiction, puis Salle Legacy à Gombe / Kinshasa pour la soirée.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {laeticiaMaxime.venues.map((venue, i) => (
              <motion.article
                key={venue.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ ...rv, delay: i * 0.08 }}
                className={`border p-8 editorial-shadow ${venue.theme === 'evening' ? 'dark bg-background border-border' : 'bg-background border-border'}`}
              >
                <p className="text-[9px] uppercase tracking-[0.52em] text-primary">
                  {venue.label}
                </p>
                <h3 className="mt-3 font-serif text-2xl text-foreground">{venue.name}</h3>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.4} />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {venue.address} · {venue.city}, République Démocratique du Congo
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.4} />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {venue.time} · {venue.theme === "blessing" ? laeticiaMaxime.date.display : laeticiaMaxime.secondDate.display}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm italic text-muted-foreground/70">
                  {venue.note}
                </p>

                <a
                  href={venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.42em] text-primary transition-opacity hover:opacity-70"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  Voir sur Google Maps
                </a>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6 · THÈMES VESTIMENTAIRES
      ══════════════════════════════════════════════════════ */}
      <section id="dresscode" className="relative overflow-hidden bg-gradient-to-br from-background to-secondary">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv} className="mb-14 text-center">
            <Label>Couleurs</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3.25rem)" }}>
              Thèmes vestimentaires
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {[laeticiaMaxime.dresscode.blessing, laeticiaMaxime.dresscode.evening].map((dc, idx) => (
              <motion.article
                key={dc.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ ...rv, delay: idx * 0.1 }}
                className={`p-8 border border-border ${idx === 1 ? 'dark bg-background' : 'bg-background'}`}
              >
                <p className="text-[9px] uppercase tracking-[0.58em] text-primary">{dc.label}</p>
                <h3 className="mt-3 font-serif text-2xl text-foreground">{dc.theme}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">{dc.description}</p>

                <div className="mt-6 flex gap-2 flex-wrap">
                  {dc.colors.map((color, i) => (
                    <div key={color} className="group relative">
                      {color === '#FFD700' ? (
                        <div
                          className="h-9 w-9 border border-yellow-400/60 gold-shimmer-swatch"
                          title={dc.colorNames[i]}
                        />
                      ) : (
                        <div
                          className="h-9 w-9 border border-foreground/20"
                          style={{ background: color }}
                          title={dc.colorNames[i]}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {dc.forbidden && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-[10px] italic text-muted-foreground/80">{dc.forbidden}</p>
                  </div>
                )}

                {idx === 1 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm leading-7 text-muted-foreground italic">
                      La soirée dansante se vit en noir chic.
                    </p>
                  </div>
                )}
              </motion.article>
            ))}
          </div>

          {/* Versets bibliques */}
          <div className="mt-16 space-y-10">
            {[
              {
                text: "Deux valent mieux qu'un, parce qu'ils retirent un meilleur salaire de leur travail. Car s'ils tombent, l'un relève l'autre ; mais malheur à celui qui est seul et qui tombe, sans avoir un second pour le relever.",
                ref: "Ecclésiaste 4 : 9–10",
              },
              {
                text: "Ainsi ils ne sont plus deux, mais ils ne font qu'une seule chair. Que l'homme donc ne sépare pas ce que Dieu a joint.",
                ref: "Matthieu 19 : 6",
              },
            ].map((verse, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ ...rv, delay: i * 0.12 }}
                className="relative pl-6"
              >
                <span className="absolute -top-3 left-0 font-serif text-5xl leading-none text-primary/15 select-none">"</span>
                <blockquote className="font-serif text-lg md:text-xl leading-9 italic text-foreground/75">
                  « {verse.text} »
                </blockquote>
                <p className="mt-4 text-[10px] uppercase tracking-[0.45em] text-muted-foreground/50">
                  — {verse.ref}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7 · CAGNOTTE — Liste de mariage
      ══════════════════════════════════════════════════════ */}
      <section id="cagnotte" className="relative overflow-hidden dark bg-background">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,hsl(var(--primary)/0.1)_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-2xl px-6 py-24 text-center md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv}>
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center border border-primary/30">
                <Gift className="h-7 w-7 text-primary" strokeWidth={1.3} />
              </div>
            </div>

            <Label>Liste de mariage</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
              {laeticiaMaxime.cagnotte.title}
            </h2>
            <p className="mt-6 text-base leading-8 text-muted-foreground whitespace-pre-wrap">
              {laeticiaMaxime.cagnotte.message}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8 · FAQ
      ══════════════════════════════════════════════════════ */}
      <section id="faq" className="relative overflow-hidden bg-background">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-2xl px-6 py-24 md:px-10 md:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={rv} className="mb-14 text-center">
            <Label>Questions fréquentes</Label>
            <h2 className="mt-5 font-serif leading-tight text-foreground" style={{ fontSize: "clamp(2rem,5vw,3.25rem)" }}>
              FAQ
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={rv}>
            <div className="border-t border-border">
              {laeticiaMaxime.faq.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ÉPILOGUE — Closing
      ══════════════════════════════════════════════════════ */}
      <footer className="px-6 py-16 text-center bg-secondary border-t border-border">
        <Rule opacity={0.5} />
        <div className="my-10">
          <img src={logoBlack} alt="Logo Laeticia & Maxime" className="mx-auto mb-8 h-20 w-20 object-contain" />
          <p className="font-script leading-none text-foreground" style={{ fontSize: "5rem" }}>{laeticiaMaxime.brand}</p>
          <p className="mt-5 text-[10px] uppercase tracking-[0.55em] text-muted-foreground">
            {laeticiaMaxime.title} · 27 août & 29 août 2026 · Kinshasa
          </p>
          <p className="mt-7 mx-auto max-w-sm font-serif text-sm italic leading-7 text-muted-foreground/80">
            {laeticiaMaxime.couple.statement}
          </p>
        </div>
        <Rule opacity={0.5} />
      </footer>
    </main>
  );
}
