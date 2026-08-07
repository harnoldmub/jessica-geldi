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

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export default function Countdown({ target }: { target: Date; dark?: boolean }) {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  const done = time.days + time.hours + time.minutes + time.seconds === 0;

  const units = [
    { value: pad(time.days, 3), label: "Jours" },
    { value: pad(time.hours), label: "Heures" },
    { value: pad(time.minutes), label: "Min" },
    { value: pad(time.seconds), label: "Sec" },
  ];

  if (done) {
    return <p className="font-serif text-4xl italic md:text-5xl">Le grand jour est arrivé.</p>;
  }

  return (
    <div className="flex items-start justify-center gap-3 sm:gap-6">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-start">
          <div className="flex flex-col items-center">
            <span className="font-serif tabular-nums leading-none" style={{ fontSize: "clamp(2.6rem, 8vw, 5rem)", fontWeight: 400 }}>
              {unit.value}
            </span>
            <span className="mt-3 text-[9px] uppercase tracking-[0.4em] opacity-70 sm:text-[10px]">{unit.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="font-serif leading-none opacity-40" style={{ fontSize: "clamp(2.2rem, 7vw, 4.4rem)" }}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
