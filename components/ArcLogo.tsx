interface Props {
  className?: string;
  size?: number;
}

export function ArcLogo({ className, size = 36 }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ARC XP"
    >
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id="arcGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer hex frame */}
      <path
        d="M32 3 L57 17.5 V46.5 L32 61 L7 46.5 V17.5 Z"
        stroke="url(#arcGrad)"
        strokeWidth="2"
        fill="rgba(124,92,255,0.08)"
      />

      {/* Inner orbits */}
      <ellipse cx="32" cy="32" rx="18" ry="7" stroke="url(#arcGrad)" strokeWidth="1.2" opacity="0.55" />
      <ellipse cx="32" cy="32" rx="7" ry="18" stroke="url(#arcGrad)" strokeWidth="1.2" opacity="0.55" />

      {/* Core node */}
      <circle cx="32" cy="32" r="5" fill="url(#arcGrad)" />
      <circle cx="32" cy="32" r="11" fill="url(#arcGlow)" />

      {/* Satellite nodes */}
      <circle cx="50" cy="32" r="2" fill="#38bdf8" />
      <circle cx="14" cy="32" r="2" fill="#a78bfa" />
      <circle cx="32" cy="14" r="2" fill="#7c5cff" />
      <circle cx="32" cy="50" r="2" fill="#38bdf8" />
    </svg>
  );
}