export function MonogramMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 250" className={className} fill="none" aria-hidden>
      <ellipse cx="100" cy="118" rx="94" ry="116" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="100" cy="118" rx="84" ry="104" stroke="currentColor" strokeWidth="2" strokeDasharray="0.5 7" strokeLinecap="round" opacity="0.85" />
      <text x="101" y="156" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="118" fill="currentColor" letterSpacing="-6">JG</text>
    </svg>
  );
}

export function MonogramLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <MonogramMark className="h-28 w-auto" />
      <p className="mt-3 font-script text-4xl leading-none">Jessica &amp; Geldi</p>
    </div>
  );
}
