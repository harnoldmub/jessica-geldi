import type { WeddingEventKey } from "@shared/JessicaGeldi";
import { weddingEvents } from "@shared/JessicaGeldi";

/* Couleurs interdites (pastilles barrées) et consignes vestimentaires d'une célébration */
export default function DressRestrictions({ eventKey, className = "" }: { eventKey: WeddingEventKey; className?: string }) {
  const event = weddingEvents[eventKey];
  if (!event.forbiddenColors?.length && !event.dressRules?.length) return null;
  return (
    <div className={className}>
      {event.forbiddenColors?.length ? (
        <>
          <p className="font-sans text-[11px] uppercase tracking-[0.18em]">Couleurs interdites</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {event.forbiddenColors.map((color) => (
              <div key={color.name} className="flex w-16 flex-col items-center gap-2">
                <span
                  className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-black/15"
                  style={{ background: color.hex }}
                  aria-hidden
                >
                  <span className="absolute left-1/2 top-[-20%] h-[140%] w-[2px] -translate-x-1/2 rotate-45 bg-[#b42318]" />
                </span>
                <span className="font-sans text-[10px] uppercase leading-3 tracking-[0.08em]">{color.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
      {event.dressRules?.map((rule) => (
        // Consigne mise en évidence : encart avec pictogramme d'interdiction
        <p
          key={rule}
          role="note"
          className="mx-auto mt-6 flex w-fit max-w-full items-center gap-3 rounded-full border border-[#b42318]/50 bg-[#b42318]/10 py-2.5 pl-3 pr-5 text-left font-sans text-[12px] font-semibold uppercase leading-5 tracking-[0.1em]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="#b42318" strokeWidth="2.2" />
            <path d="M5.5 5.5l13 13" stroke="#b42318" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span>{rule.replace(/\.$/, "")}</span>
        </p>
      ))}
    </div>
  );
}
