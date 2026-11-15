/** Desktop hero: radial field + dual-tone glow ring */
export function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden>
      <svg
        className="hero-rays"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const x2 = 50 + Math.cos(a) * 70;
          const y2 = 50 + Math.sin(a) * 70;
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.055)"
              strokeWidth="0.12"
            />
          );
        })}
        {[18, 28, 38].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.15"
          />
        ))}
      </svg>
      <div className="hero-glow" />
      <div className="hero-glow-ring" />
    </div>
  );
}
