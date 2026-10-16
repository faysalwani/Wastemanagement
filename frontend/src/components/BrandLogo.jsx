import React from 'react';

/**
 * Reusable Clear Waste Brand Logo & Wordmark
 * Matches the Clear Waste visual identity:
 * - Soft green rounded container (#E5F4E8)
 * - Primary green leaf-drop mark (#21834A) with clean checkmark and base curve
 * - Wordmark "Clear Waste" + optional tagline "Smarter waste. Cleaner communities."
 */
export function BrandMark({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} flex-shrink-0`}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#E5F4E8" />
      <path
        d="M32 11C32 11 17 26.5 17 37.5C17 45.7843 23.7157 52.5 32 52.5C40.2843 52.5 47 45.7843 47 37.5C47 26.5 32 11 32 11Z"
        fill="#21834A"
      />
      <path
        d="M25.5 37.5L30 42L39.5 32.5"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 54.5C21 57.5 43 57.5 48 54.5"
        stroke="#21834A"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  showTagline = true,
  size = 'md',
  className = '',
}) {
  const markSize =
    size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const titleSize =
    size === 'lg'
      ? 'text-2xl'
      : size === 'sm'
      ? 'text-base'
      : 'text-lg sm:text-xl';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BrandMark className={markSize} />
      <div className="flex flex-col justify-center text-left">
        <span
          className={`font-bold tracking-tight text-[#21834A] leading-tight ${titleSize}`}
        >
          Clear Waste
        </span>
        {showTagline && (
          <span className="text-xs text-[#526356] font-normal leading-tight mt-0.5">
            Smarter waste. Cleaner communities.
          </span>
        )}
      </div>
    </div>
  );
}
