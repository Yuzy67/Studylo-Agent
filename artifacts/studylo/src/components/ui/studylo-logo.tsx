export function StudyloMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="url(#sl_bg)" />
      {/* Outer ring arc — top */}
      <path
        d="M10 11 Q16 7 22 11"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      {/* Inner node cluster */}
      <circle cx="16" cy="16" r="2.2" fill="white" opacity="0.95" />
      {/* Left spoke */}
      <line x1="9.5" y1="16" x2="13.8" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Right spoke */}
      <line x1="18.2" y1="16" x2="22.5" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Bottom-left spoke */}
      <line x1="10.8" y1="21" x2="14.4" y2="17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Bottom-right spoke */}
      <line x1="21.2" y1="21" x2="17.6" y2="17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Outer ring arc — bottom */}
      <path
        d="M10 21 Q16 25 22 21"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <defs>
        <linearGradient id="sl_bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StudyloWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-white ${className}`} style={{ fontFamily: "var(--app-font-serif)" }}>
      Studylo
    </span>
  );
}
