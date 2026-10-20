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
        <p key={rule} className="mt-4 font-body text-[1.05rem] font-medium">
          <span aria-hidden>🚫 </span>
          {rule}
        </p>
      ))}
    </div>
  );
}
