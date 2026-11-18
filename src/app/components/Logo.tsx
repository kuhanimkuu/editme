import { useId } from 'react';

/** The EditMe mark: an "E" whose middle bar is a play button. Same drawing as brand/mark.svg. */
export function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={`${className} flex-shrink-0`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9333ea" />
          <stop offset="0.5" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id})`} />
      <g fill="#fff" transform="translate(2 0)">
        <rect x="15" y="15" width="7.5" height="34" rx="3.75" />
        <rect x="15" y="15" width="30" height="7.5" rx="3.75" />
        <rect x="15" y="41.5" width="30" height="7.5" rx="3.75" />
        <path d="M27 26.2V37.8Q27 40 29 38.9L38.6 33.1Q40.4 32 38.6 30.9L29 25.1Q27 24 27 26.2Z" />
      </g>
    </svg>
  );
}
