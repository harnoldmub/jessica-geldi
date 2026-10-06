import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import Lenis from "lenis";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { JessicaGeldi, weddingEvents, type WeddingEventKey } from "@shared/JessicaGeldi";
import { defaultSiteSettings, type SiteSettings } from "@shared/siteSettings";
import RsvpForm from "@/components/RsvpForm";
import Countdown from "@/components/Countdown";
import GalleryLightbox from "@/components/GalleryLightbox";
import { DrumIcon, GlassesIcon, LaceFrame, RingsIcon, SealDivider } from "@/components/Stationery";
import { themeVars } from "@/lib/eventThemes";

const ease = [0.22, 1, 0.36, 1] as const;

/* Les vraies photos du couple (N&B) viendront remplir ces cadres : renseigner `src`. */
const photos: { src?: string; alt: string; caption: string }[] = [
  { alt: "Jessica & Geldi, les mains", caption: "Main dans la main" },
  { alt: "Jessica & Geldi en ville", caption: "Kinshasa, nos rues" },
  { alt: "Jessica & Geldi, portrait", caption: "Nous deux" },
];
const heroPhoto: string | undefined = undefined;

const eventIcons: Record<WeddingEventKey, (props: { className?: string }) => JSX.Element> = {
  customary: DrumIcon,
  civil: RingsIcon,
  evening: GlassesIcon,
};

function Photo({ src, alt, className = "", tone = "mono" }: { src?: string; alt: string; className?: string; tone?: "mono" | "wine" }) {
  return (
    <div className={`${tone === "mono" ? "mono-photo" : "wine-photo"} grain relative overflow-hidden ${className}`}>
      {src ? <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : <span className="sr-only">{alt}</span>}
    </div>
  );
}

function Reveal({ children, y = 20, delay = 0, className = "" }: { children: ReactNode; y?: number; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SmallCaps({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-body text-[13px] uppercase leading-6 tracking-[0.16em] ${className}`}>{children}</p>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-taccent/15">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="font-serif text-lg md:text-xl">{q}</span>
        {open ? <Minus className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.2} /> : <Plus className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.2} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
            <p className="pb-6 text-lg leading-8 text-tink/70">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Nav() {
  const links = [
    { href: "#date", label: "La date" },
    { href: "#details", label: "Détails" },
    { href: "#programme", label: "Programme" },
    { href: "#rsvp", label: "RSVP" },
  ];
  return (
    <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: 1.2 }} className="fixed inset-x-0 top-0 z-40 flex justify-center px-4">
      <nav className="mt-4 flex items-center gap-4 bg-tdeep/70 px-4 py-2.5 text-tbandink backdrop-blur-md sm:gap-8 sm:px-7">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="whitespace-nowrap font-body text-[10px] uppercase tracking-[0.2em] text-tbandink/80 transition-colors hover:text-white sm:text-[11px] sm:tracking-[0.28em]">
            {l.label}
          </a>
        ))}
      </nav>
    </motion.header>
  );
}

type GalleryPreview = { src?: string; alt: string; caption: string } | null;

/* Une page d'accueil par événement (/coutumier, /civil, /soiree) : on ne mélange pas les célébrations,
   et aucune adresse n'y figure — seulement Kinshasa, Congo. */
export default function EventHome({ eventKey }: { eventKey: WeddingEventKey }) {
  const { data: siteSettings = defaultSiteSettings } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });
  const reduce = useReducedMotion();
  const event = weddingEvents[eventKey];
  const eventDate = new Date(event.iso);
  const isUpcoming = eventDate.getTime() > Date.now();
  const [galleryItem, setGalleryItem] = useState<GalleryPreview>(null);
  const EventIcon = eventIcons[eventKey];
  const program = siteSettings.program.filter((item) => item.event === eventKey);
  const programItems = program.length ? program : [{ event: eventKey, time: event.time, title: event.label, text: "" }];
  const faq = [
    { q: "Quel est le thème ?", a: `${event.theme}. ${event.themeNote}` },
    { q: "Quand a lieu la célébration ?", a: `${event.label} : ${event.date}${/confirmer/i.test(event.time) ? "" : ` à ${event.time}`}, à Kinshasa, Congo.` },
    ...JessicaGeldi.faq.filter((item) => /accompagn/i.test(item.q)),
  ];

  useEffect(() => {
    document.title = `${event.label} · Jessica & Geldi`;
  }, [event.label]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let frame: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  const write = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
          animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
          transition: { duration: 1.6, ease, delay },
        };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-tpaper text-tink" style={themeVars(eventKey)}>
      <Nav />

      {/* ══════════════ HÉROS — noms manuscrits sur médaillon dentelle ══════════════ */}
      <section className="wine-band relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-24 pt-24">
        <div className="relative w-full max-w-[640px]">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease }} className="mx-auto w-[66%] max-w-[360px]">
            <LaceFrame className="aspect-[320/380] text-tlace">
              <Photo src={heroPhoto} alt="Jessica et Geldi" tone="wine" className="h-full w-full" />
            </LaceFrame>
          </motion.div>

          <h1 className="pointer-events-none absolute inset-0 text-tbandink">
            <motion.span {...write(0.5)} className="signature absolute left-0 top-[14%] block text-[clamp(4.5rem,19vw,9.5rem)] drop-shadow-[0_2px_12px_rgba(40,0,8,0.35)]">
              Jessica
            </motion.span>
            <motion.span {...write(1)} className="absolute left-1/2 top-[42%] block -translate-x-1/2 font-serif text-[clamp(2.6rem,8vw,4.5rem)] italic">
              &amp;
            </motion.span>
            <motion.span {...write(1.3)} className="signature absolute bottom-[14%] right-0 block text-[clamp(4.5rem,19vw,9.5rem)] drop-shadow-[0_2px_12px_rgba(40,0,8,0.35)]">
              Geldi
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 1.9 }} className="display-caps mt-6 text-right text-lg uppercase tracking-[0.16em] text-tbandink/90 md:text-xl">
            se marient
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 2.1 }} className="mt-3 text-right font-body text-xs uppercase tracking-[0.36em] text-tbandink/65">
            {event.label} · {event.date.replace(" 2027", "")}
          </motion.p>
        </div>
      </section>

      <SealDivider />

      {/* ══════════════ SAVE THE DATE ══════════════ */}
      <section id="date" className="cream-band px-5 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <h2 className="relative inline-flex items-center justify-center gap-3 text-tink sm:gap-6" aria-label="Save the date">
              <span className="display-caps text-[clamp(3.4rem,13vw,8rem)]">SAVE</span>
              <span className="signature -mx-2 translate-y-[18%] text-[clamp(3.6rem,13vw,8rem)] text-taccent">the</span>
              <span className="display-caps text-[clamp(3.4rem,13vw,8rem)]">DATE</span>
            </h2>
            <p className="mt-6 font-body text-sm uppercase tracking-[0.42em] md:text-base">{event.date}</p>
            <p className="mt-2 font-body text-xs uppercase tracking-[0.36em] text-tink/60">{event.label} · Kinshasa, Congo</p>
          </Reveal>

          <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-6">
            {photos.map((photo, i) => (
              <Reveal key={photo.caption} delay={i * 0.1}>
                <button type="button" onClick={() => setGalleryItem(photo)} className="group block w-full" aria-label={`Agrandir : ${photo.caption}`}>
                  <Photo src={photo.src} alt={photo.alt} className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                </button>
              </Reveal>
            ))}
          </div>

          <Reveal className="mx-auto mt-14 max-w-xl">
            <p className="font-body text-xl leading-9 text-tink/80">{siteSettings.invitationText}</p>
            {isUpcoming && (
              <div className="mt-10 text-taccent">
                <Countdown target={eventDate} />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <SealDivider />

      {/* ══════════════ LES DÉTAILS ══════════════ */}
      <section id="details" className="wine-band relative px-5 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="relative z-10 text-center">
            <h2 className="signature text-[clamp(4rem,14vw,8rem)] text-tbandink">Les détails</h2>
          </Reveal>

          <Reveal delay={0.1} className="relative -mt-6 md:-mt-10">
            <div className="relative overflow-hidden">
              <Photo tone="wine" alt="" className="absolute inset-0" />
              <div className="absolute inset-0 bg-tband/55" />
              <div className="relative grid gap-12 px-6 py-14 text-center md:grid-cols-3 md:gap-8 md:px-10 md:py-16">
                <article>
                  <h3 className="display-caps text-3xl uppercase md:text-[2rem]">Quand</h3>
                  <div className="mx-auto my-5 h-px w-12 bg-tbandink/30" />
                  <SmallCaps className="text-tbandink/85">{event.date}</SmallCaps>
                  <SmallCaps className="text-tbandink/70">{event.time}</SmallCaps>
                </article>
                <article>
                  <h3 className="display-caps text-3xl uppercase md:text-[2rem]">Où</h3>
                  <div className="mx-auto my-5 h-px w-12 bg-tbandink/30" />
                  <SmallCaps className="text-tbandink/85">Kinshasa, Congo</SmallCaps>
                </article>
                <article>
                  <h3 className="display-caps text-3xl uppercase md:text-[2rem]">Dress code</h3>
                  <div className="mx-auto my-5 h-px w-12 bg-tbandink/30" />
                  <SmallCaps className="text-tbandink/85">{event.theme}</SmallCaps>
                  <div className="mt-3 flex justify-center gap-2" aria-label={`Couleurs : ${event.colorNames.join(", ")}`}>
                    {event.palette.map((color, i) => (
                      <span key={color} title={event.colorNames[i]} className="h-5 w-5 rounded-full border border-white/40" style={{ background: color }} />
                    ))}
                  </div>
                  <p className="mx-auto mt-3 max-w-xs font-body text-base italic leading-7 text-tbandink/70">{event.themeNote}</p>
                </article>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ NOTRE PROGRAMME ══════════════ */}
      <section id="programme" className="cream-band overflow-hidden">
        <div className="mx-auto grid max-w-6xl md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
          <div className="px-5 py-16 md:px-10 md:py-24">
            <Reveal>
              <h2 className="display-caps text-[clamp(2.8rem,8vw,4.6rem)] uppercase text-taccent">Notre programme</h2>
              <p className="mt-2 pl-1 font-body text-sm uppercase tracking-[0.4em] text-tink/70">{event.label} · {event.date.replace(" 2027", "")}</p>
            </Reveal>

            {/* Frise : pictos trait au-dessus, intitulés manuscrits en quinconce */}
            <div className="relative mt-14 hidden md:block">
              <div className="absolute inset-x-0 top-[104px] h-px bg-taccent/35" />
              <ol className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(programItems.length, 1)}, minmax(0, 1fr))` }}>
                {programItems.map((item, i) => {
                  const Icon = EventIcon;
                  return (
                    <motion.li
                      key={`${item.event}-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 1, ease, delay: i * 0.12 }}
                      className="relative flex flex-col items-center px-3 text-center"
                    >
                        <Icon className="h-20 w-20 text-tink/80" />
                        <span className="relative z-10 mt-5 h-3 w-3 rounded-full border border-taccent bg-tpaper" />
                        <div className={i % 2 ? "mt-16" : "mt-5"}>
                          <p className="display-caps text-3xl text-taccent">{item.time}</p>
                          <p className="signature mt-2 text-4xl">{item.title}</p>
                          {item.text && <p className="mx-auto mt-1 max-w-[16rem] font-body text-[15px] leading-6 text-tink/65">{item.text}</p>}
                        </div>
                    </motion.li>
                  );
                })}
              </ol>
            </div>

            {/* Mobile : frise verticale */}
            <ol className="mt-12 space-y-10 border-l border-taccent/30 pl-6 md:hidden">
              {programItems.map((item, i) => {
                const Icon = EventIcon;
                return (
                  <motion.li
                    key={`${item.event}-${i}-m`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 1, ease }}
                    className="relative"
                  >
                      <span className="absolute -left-[31px] top-4 h-2.5 w-2.5 rounded-full border border-taccent bg-tpaper" />
                      <div className="flex items-start gap-4">
                        <Icon className="h-14 w-14 shrink-0 text-tink/80" />
                        <div>
                          <p className="display-caps text-2xl text-taccent">{item.time}</p>
                          <p className="signature mt-1 text-4xl">{item.title}</p>
                          {item.text && <p className="font-body text-[15px] leading-6 text-tink/65">{item.text}</p>}
                        </div>
                      </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
          <Photo alt="Jessica et Geldi" className="hidden min-h-full md:block" />
        </div>
      </section>

      <SealDivider />

      {/* ══════════════ RSVP — grand monogramme ══════════════ */}
      <section id="rsvp" className="wine-band px-5 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="text-center lg:sticky lg:top-24 lg:text-left">
            <p className="font-serif leading-[0.82] text-tdeep" aria-hidden>
              <span className="block text-[clamp(7rem,22vw,13rem)]">J</span>
              <span className="-mt-4 block pl-[0.6em] text-[clamp(4rem,12vw,7rem)] italic lg:pl-[0.9em]">&amp;</span>
              <span className="-mt-4 block pl-[0.5em] text-[clamp(7rem,22vw,13rem)] lg:pl-[0.8em]">G</span>
            </p>
            <h2 className="signature mt-6 text-7xl text-tbandink">Rsvp</h2>
            <p className="display-caps mt-3 text-2xl uppercase tracking-[0.14em]">Jessica &amp; Geldi</p>
            <SmallCaps className="mx-auto mt-5 max-w-sm text-tbandink/75 lg:mx-0">
              Merci de nous répondre au plus tôt pour le {event.label.toLowerCase()} du {event.date.replace(/^\S+ /, "").replace(" 2027", "")}.
            </SmallCaps>
          </Reveal>
          <Reveal delay={0.1} y={30}>
            <div className="bg-tpaper text-tink shadow-[0_30px_80px_-40px_rgba(20,0,4,0.6)]">
              <RsvpForm
                allowedEvents={[eventKey]}
                title="Répondre à l'invitation"
                description={`Dites-nous si vous serez présent(e) au ${event.label.toLowerCase()}, si vous venez seul(e) ou en couple, et votre boisson souhaitée.`}
                submitLabel="Envoyer ma réponse"
                successDescription="Merci du fond du cœur. Votre réponse est bien enregistrée — nous avons hâte de célébrer avec vous."
              />
            </div>
          </Reveal>
        </div>
      </section>

      <SealDivider />

      {/* ══════════════ PRATIQUE & FAQ ══════════════ */}
      <section id="infos" className="cream-band px-5 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-3xl">
          {siteSettings.practical.length > 0 && (
            <div>
              <Reveal className="text-center"><h2 className="display-caps text-4xl uppercase text-taccent md:text-5xl">Infos pratiques</h2></Reveal>
              <div className="mt-10 grid gap-px border border-taccent/15 bg-taccent/15 md:grid-cols-2">
                {siteSettings.practical.map((item, index) => (
                  <Reveal key={`${item.title}-${index}`} delay={index * 0.04} className="bg-tpaper p-7">
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    <p className="mt-3 whitespace-pre-line font-body text-lg leading-8 text-tink/70">{item.text}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          <div className="mt-20">
            <Reveal className="text-center"><h2 className="display-caps text-4xl uppercase text-taccent md:text-5xl">Questions fréquentes</h2></Reveal>
            <Reveal delay={0.1} className="mt-8 border-t border-taccent/15">
              {faq.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════ PIED DE PAGE ══════════════ */}
      <footer className="wine-band px-5 py-20 text-center md:px-10">
        {siteSettings.contribution.enabled && (
          <Reveal className="mx-auto max-w-2xl">
            <p className="display-caps text-3xl uppercase leading-tight md:text-4xl">{siteSettings.contribution.title}</p>
            <SmallCaps className="mx-auto mt-5 max-w-xl text-tbandink/75">{siteSettings.contribution.message}</SmallCaps>
          </Reveal>
        )}
        <p className="signature mt-16 text-7xl text-tbandink md:text-8xl">Jessica &amp; Geldi</p>
        <SmallCaps className="mt-4 text-tbandink/60">{event.label} · {event.date} · Kinshasa, Congo</SmallCaps>
        <p className="mx-auto mt-6 max-w-md whitespace-pre-line font-body text-lg italic leading-8 text-tbandink/70">{siteSettings.footerText}</p>
      </footer>

      <GalleryLightbox item={galleryItem} onClose={() => setGalleryItem(null)} />
    </main>
  );
}

/* Racine du site : aiguillage vers la page de chaque événement, protégé par un code d'accès. */
export function EventChooser() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    document.title = "Jessica & Geldi";
    let active = true;
    fetch("/api/site-access")
      .then((response) => response.json())
      .then((body) => {
        if (active) setGranted(body.granted === true);
      })
      .catch(() => {
        if (active) setGranted(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/site-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Code d'accès incorrect.");
        return;
      }
      setGranted(true);
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
    } finally {
      setChecking(false);
    }
  }

  if (granted === null) {
    return (
      <main className="wine-band flex min-h-[100svh] items-center justify-center px-5 text-center">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-tbandink/70">Vérification de l'accès…</p>
      </main>
    );
  }

  if (!granted) {
    return (
      <main className="wine-band flex min-h-[100svh] flex-col items-center justify-center px-5 py-16 text-center">
        <p className="signature text-[clamp(3.6rem,14vw,7rem)] text-tbandink">Jessica &amp; Geldi</p>
        <p className="mt-2 font-body text-xs uppercase tracking-[0.36em] text-tbandink/60">Espace privé</p>
        <form onSubmit={submit} className="mt-12 w-full max-w-xs">
          <label htmlFor="site-code" className="block font-body text-[11px] uppercase tracking-[0.3em] text-tbandink/75">
            Code d'accès
          </label>
          <input
            id="site-code"
            type="password"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "site-code-error" : undefined}
            className="mt-3 h-12 w-full border border-tbandink/30 bg-transparent px-4 text-center font-body text-lg tracking-[0.2em] text-tbandink outline-none placeholder:text-tbandink/40 focus:border-tbandink"
          />
          {error && <p id="site-code-error" role="alert" className="mt-3 font-body text-sm text-tbandink/85">{error}</p>}
          <button
            type="submit"
            disabled={checking || !code.trim()}
            className="mt-5 h-12 w-full bg-tpaper font-body text-[11px] uppercase tracking-[0.3em] text-taccent transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {checking ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="wine-band flex min-h-[100svh] flex-col items-center justify-center px-5 py-16 text-center">
      <p className="signature text-[clamp(4rem,16vw,8rem)] text-tbandink">Jessica &amp; Geldi</p>
      <p className="display-caps mt-4 text-xl uppercase tracking-[0.16em] text-tbandink/90">se marient</p>
      <p className="mt-2 font-body text-xs uppercase tracking-[0.36em] text-tbandink/60">Kinshasa, Congo</p>
      <div className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {(Object.keys(weddingEvents) as WeddingEventKey[]).map((key) => {
          const event = weddingEvents[key];
          const Icon = eventIcons[key];
          return (
            <Link key={key} href={`/${event.slug}`} style={themeVars(key)} className="cream-band group flex flex-col items-center px-6 py-10 transition-transform duration-300 hover:-translate-y-1">
              <Icon className="h-14 w-14 text-tink/80" />
              <span className="signature mt-4 text-5xl text-taccent">{event.shortLabel}</span>
              <span className="mt-3 font-body text-xs uppercase tracking-[0.3em] text-tink/70">{event.date.replace(" 2027", "")}</span>
              <span className="mt-6 font-body text-[11px] uppercase tracking-[0.3em] text-taccent">Découvrir →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
