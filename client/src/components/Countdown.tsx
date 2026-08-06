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

  const done = time.days + time.hours + time.minutes + time.seconds === 0;

  const units = [
    { value: time.days, label: "Jours" },
    { value: time.hours, label: "Heures" },
    { value: time.minutes, label: "Min" },
    { value: time.seconds, label: "Sec" },
  ];

  const cell = dark
    ? "border-white/20 bg-white/[0.04] text-white"
    : "border-primary/20 bg-white/60 text-foreground";
  const sub = dark ? "text-white/55" : "text-muted-foreground";

  if (done) {
    return (
      <p className={`font-script text-4xl ${dark ? "text-white" : "text-primary"}`}>
        C'est le grand jour !
      </p>
    );
  }

  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      {units.map((unit) => (
        <div
          key={unit.label}
          className={`flex min-w-[3.9rem] flex-1 flex-col items-center border px-2 py-3 backdrop-blur-sm sm:min-w-[4.6rem] sm:px-4 sm:py-4 ${cell}`}
        >
          <span
            className="font-serif tabular-nums leading-none"
            style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.6rem)", fontWeight: 500 }}
          >
            {pad(unit.value)}
          </span>
          <span className={`mt-2 text-[8px] uppercase tracking-[0.34em] sm:text-[9px] ${sub}`}>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
