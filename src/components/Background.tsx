"use client";

const FLOATING_NUMBERS = [
  "3.14", "9.58", "7.07", "42", "1.62", "2.71", "11.29", "π", "e", "φ",
  "19.19", "8.88", "12.34", "1.23", "7.77", "0.00", "100", "∞",
];

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />
      <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-teal-500/8 blur-[120px]" />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/6 blur-[90px]" />

      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <svg width="420" height="420" viewBox="0 0 420 420" className="animate-orbit opacity-[0.06]">
          <circle cx="210" cy="210" r="200" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="8 12" />
          <circle cx="210" cy="210" r="160" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 16" opacity="0.5" />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {FLOATING_NUMBERS.map((num, i) => (
        <span
          key={num}
          className="animate-float absolute font-mono text-sm font-bold text-white/20"
          style={{
            left: `${8 + (i * 17) % 84}%`,
            top: `${5 + (i * 23) % 88}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${5 + (i % 4)}s`,
            fontSize: i % 3 === 0 ? "1.1rem" : "0.85rem",
          }}
        >
          {num}
        </span>
      ))}

      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"
        style={{ animation: "scanline 8s linear infinite" }}
      />
    </div>
  );
}
