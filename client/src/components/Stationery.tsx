import type { ReactNode } from "react";

/* Ornements du faire-part bordeaux & crème : sceau de cire, cadre dentelle, pictos trait. */

/* ─── Sceau de cire ─── */
const sealEdge = (() => {
  const points: string[] = [];
  const steps = 72;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = 46 + Math.sin(a * 7) * 1.6 + Math.sin(a * 13 + 1.3) * 1.1 + Math.cos(a * 3 + 0.4) * 1.4;
    points.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
})();

export function WaxSeal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="wax-body" cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--seal-light)" }} />
          <stop offset="45%" style={{ stopColor: "var(--seal-mid)" }} />
          <stop offset="100%" style={{ stopColor: "var(--seal-dark)" }} />
        </radialGradient>
        <radialGradient id="wax-well" cx="60%" cy="65%" r="70%">
          <stop offset="0%" style={{ stopColor: "var(--seal-mid)" }} />
          <stop offset="100%" style={{ stopColor: "var(--seal-dark)" }} />
        </radialGradient>
        <filter id="wax-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#2a0207" floodOpacity="0.45" />
        </filter>
      </defs>
      <path d={sealEdge} fill="url(#wax-body)" filter="url(#wax-shadow)" />
      <circle cx="50" cy="50" r="31" fill="url(#wax-well)" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="#3d0610" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="50.6" cy="50.8" r="31" fill="none" stroke="#e46a74" strokeOpacity="0.35" strokeWidth="0.7" />
      <circle cx="50" cy="50" r="26.5" fill="none" stroke="#3d0610" strokeOpacity="0.35" strokeWidth="0.6" strokeDasharray="0.6 2.2" strokeLinecap="round" />
      <text x="50.7" y="58.6" textAnchor="middle" fontFamily="'Bodoni Moda', Didot, serif" fontStyle="italic" fontSize="24" fill="#e46a74" fillOpacity="0.35">JG</text>
      <text x="50" y="58" textAnchor="middle" fontFamily="'Bodoni Moda', Didot, serif" fontStyle="italic" fontSize="24" fill="#3d0610" fillOpacity="0.7">JG</text>
    </svg>
  );
}

/** Sceau posé à cheval entre deux bandeaux. */
export function SealDivider() {
  return (
    <div className="relative z-20 flex h-0 justify-center" aria-hidden>
      <WaxSeal className="h-16 w-16 -translate-y-1/2 md:h-20 md:w-20" />
    </div>
  );
}

/* ─── Cadre ovale en dentelle ─── */
const RX = 118;
const RY = 150;
const CX = 160;
const CY = 190;

function ellipsePoint(t: number, grow: number) {
  return { x: CX + Math.cos(t) * (RX + grow), y: CY + Math.sin(t) * (RY + grow) };
}

const scallops = Array.from({ length: 64 }, (_, i) => ellipsePoint((i / 64) * Math.PI * 2, 10));
const picots = Array.from({ length: 128 }, (_, i) => ellipsePoint((i / 128) * Math.PI * 2, 22));
const petals = Array.from({ length: 32 }, (_, i) => {
  const t = (i / 32) * Math.PI * 2;
  const p = ellipsePoint(t, 16);
  return { ...p, angle: (Math.atan2(Math.sin(t) * RX, Math.cos(t) * RY) * 180) / Math.PI };
});

export function LaceFrame({ className = "", children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 320 380" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="0.9">
          {scallops.map((p, i) => (
            <circle key={`s${i}`} cx={p.x} cy={p.y} r="7.4" opacity="0.75" />
          ))}
          {petals.map((p, i) => (
            <ellipse key={`p${i}`} cx={p.x} cy={p.y} rx="6.5" ry="2.6" transform={`rotate(${p.angle} ${p.x} ${p.y})`} opacity="0.6" />
          ))}
          <ellipse cx={CX} cy={CY} rx={RX + 3} ry={RY + 3} strokeWidth="1.3" />
          <ellipse cx={CX} cy={CY} rx={RX + 30} ry={RY + 30} strokeDasharray="1 4" strokeLinecap="round" opacity="0.7" />
        </g>
        <g fill="currentColor">
          {picots.map((p, i) => (
            <circle key={`d${i}`} cx={p.x} cy={p.y} r={i % 2 ? 0.9 : 1.6} opacity="0.8" />
          ))}
        </g>
      </svg>
      <div
        className="absolute overflow-hidden rounded-[50%]"
        style={{ left: `${((CX - RX) / 320) * 100}%`, right: `${((CX - RX) / 320) * 100}%`, top: `${((CY - RY) / 380) * 100}%`, bottom: `${((CY - RY) / 380) * 100}%` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Pictos trait (programme) ─── */
const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DrumIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden {...iconProps}>
      <ellipse cx="32" cy="14" rx="15" ry="5" />
      <path d="M17 14c0 10 7 14 8 22l-3 20h20l-3-20c1-8 8-12 8-22" />
      <path d="M22 56h20" />
      <path d="M18 17l10 14M46 17L36 31M25 19l7 12 7-12" opacity="0.7" />
      <path d="M48 6l-6 9M52 9l-8 7" />
    </svg>
  );
}

export function RingsIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden {...iconProps}>
      <circle cx="25" cy="38" r="14" />
      <circle cx="25" cy="38" r="11" opacity="0.6" />
      <circle cx="40" cy="34" r="14" />
      <circle cx="40" cy="34" r="11" opacity="0.6" />
      <path d="M36 18l4-5 4 5-4 3z" />
    </svg>
  );
}

export function ChurchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden {...iconProps}>
      <path d="M32 4v10M28 8h8" />
      <path d="M22 26l10-12 10 12" />
      <path d="M24 26v32h16V26" />
      <path d="M10 58V36l14-8M54 58V36l-14-8" />
      <path d="M6 58h52" />
      <path d="M29 58v-9a3 3 0 0 1 6 0v9" />
      <circle cx="32" cy="35" r="3.2" />
      <path d="M15 44h4v6h-4zM45 44h4v6h-4z" opacity="0.7" />
    </svg>
  );
}

export function GlassesIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden {...iconProps}>
      <path d="M14 12h12l-2 16a4 4 0 0 1-8 0z" transform="rotate(-12 20 20)" />
      <path d="M38 12h12l-2 16a4 4 0 0 1-8 0z" transform="rotate(12 44 20)" />
      <path d="M22 33l-3 20M42 33l3 20M13 54h12M39 54h12" />
      <path d="M30 10l2-5M34 11l3-3M27 11l-3-3" opacity="0.7" />
    </svg>
  );
}

/* ─── Couronne de feuillage ovale (couverture d'invitation) ─── */
const wreathLeaves = (() => {
  const leaves: { x: number; y: number; angle: number; size: number }[] = [];
  const rx = 78;
  const ry = 100;
  // Deux branches partant du bas, qui remontent de chaque côté sans se rejoindre en haut.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 17; i++) {
      const t = Math.PI / 2 + side * (0.18 + (i / 16) * 2.55);
      const x = 100 + Math.cos(t) * rx;
      const y = 120 + Math.sin(t) * ry;
      const tangent = (Math.atan2(Math.cos(t) * ry, -Math.sin(t) * rx) * 180) / Math.PI;
      const size = 1 - i / 30;
      leaves.push({ x, y, angle: tangent + (i % 2 ? 38 : -38) * side, size });
    }
  }
  return leaves;
})();

export function Wreath({ className = "", children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 240" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
          <ellipse cx="100" cy="120" rx="66" ry="88" opacity="0.55" />
          <ellipse cx="100" cy="120" rx="61" ry="83" strokeDasharray="0.4 3.2" opacity="0.7" />
          <path d="M100 220c-26 0-60-42-60-100" opacity="0.75" transform="translate(0 0)" />
          <path d="M100 220c26 0 60-42 60-100" opacity="0.75" />
          {wreathLeaves.map((l, i) => (
            <path
              key={i}
              d={`M0 0c${3 * l.size} ${-4 * l.size} ${3 * l.size} ${-10 * l.size} 0 ${-14 * l.size}c${-3 * l.size} ${4 * l.size} ${-3 * l.size} ${10 * l.size} 0 ${14 * l.size}z`}
              transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${(l.angle + 90).toFixed(1)})`}
            />
          ))}
          <path d="M92 222c4-4 12-4 16 0M100 222l-7 9M100 222l7 9" />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
