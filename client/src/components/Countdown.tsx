import { useEffect, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({
  target,
  dark = false,
}: {
  target: Date;
  dark?: boolean;
}) {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  const units = [
    { value: time.days, label: "Jours" },
    { value: time.hours, label: "Heures" },
    { value: time.minutes, label: "Min" },
    { value: time.seconds, label: "Sec" },
  ];

  return (
    <div className={`flex items-center gap-1 ${dark ? "border border-white/25 bg-[#5f4828]/50 px-3 py-3 text-white shadow-xl backdrop-blur-sm" : ""}`}>
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center">
          <div className="px-2 text-center sm:px-3">
            <p
              className={`font-serif tabular-nums leading-none ${dark ? "text-white" : "text-foreground"}`}
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}
            >
              {pad(unit.value)}
            </p>
            <p className={`mt-1 text-[9px] uppercase tracking-[0.32em] ${dark ? "text-white/80" : "text-muted-foreground"}`}>
              {unit.label}
            </p>
          </div>
          {i < units.length - 1 && (
            <span className={`select-none pb-4 font-serif text-xl ${dark ? "text-white/55" : "text-border"}`}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
