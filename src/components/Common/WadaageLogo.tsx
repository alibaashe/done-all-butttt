import React from 'react';

export interface WadaageLogoProps {
  variant?: 'badge' | 'icon' | 'wordmark' | 'full' | 'header';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  theme?: 'dark' | 'light' | 'transparent';
  colorMode?: 'white' | 'dark' | 'auto';
  showTagline?: boolean;
  appType?: 'rider' | 'driver' | 'admin';
  useImage?: boolean;
}

export const WadaageLogo: React.FC<WadaageLogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  className = '',
  theme = 'transparent',
  colorMode = 'auto',
  showTagline = false,
  appType = 'rider',
  useImage = false,
}) => {
  const isDriver = appType === 'driver';

  // Determine stroke color based on colorMode and theme
  let effectiveStrokeColor = '#FFFFFF';
  if (colorMode === 'dark' || (colorMode === 'auto' && theme === 'light')) {
    effectiveStrokeColor = '#0F172A';
  } else if (colorMode === 'white' || (colorMode === 'auto' && (theme === 'dark' || theme === 'transparent'))) {
    effectiveStrokeColor = '#FFFFFF';
  }

  // Size definitions
  const sizeConfig: Record<string, { badge: string; wordmarkH: number; icon: string }> = {
    xs: { badge: 'w-8 h-8', wordmarkH: 26, icon: 'w-7 h-7' },
    sm: { badge: 'w-11 h-11', wordmarkH: 34, icon: 'w-9 h-9' },
    md: { badge: 'w-16 h-16', wordmarkH: 42, icon: 'w-12 h-12' },
    lg: { badge: 'w-24 h-24', wordmarkH: 54, icon: 'w-16 h-16' },
    xl: { badge: 'w-36 h-36', wordmarkH: 70, icon: 'w-24 h-24' },
    '2xl': { badge: 'w-52 h-52', wordmarkH: 90, icon: 'w-36 h-36' },
    custom: { badge: 'w-full h-full', wordmarkH: 42, icon: 'w-full h-full' },
  };

  const dim = sizeConfig[size] || sizeConfig.md;

  // 1. Standalone Wordmark (Wadaage + — Share — with speed lines)
  const renderWordmarkSVG = () => {
    return (
      <svg
        viewBox="0 0 460 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: dim.wordmarkH, width: 'auto' }}
        className="max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] overflow-visible shrink-0 select-none"
      >
        <defs>
          <filter id="wPinGlowWordmark" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00E676" floodOpacity="0.65" />
          </filter>
          <linearGradient id="neonGreenPinWordmark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="60%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
          <linearGradient id="topArchGradWordmark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={effectiveStrokeColor} stopOpacity="0.1" />
            <stop offset="25%" stopColor={effectiveStrokeColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={effectiveStrokeColor} stopOpacity="1" />
            <stop offset="75%" stopColor={effectiveStrokeColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={effectiveStrokeColor} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Top Horizon Arch */}
        <path
          d="M 95 24 C 175 4, 285 4, 385 24"
          stroke="url(#topArchGradWordmark)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Lime Green Pin on 'W' */}
        <g filter="url(#wPinGlowWordmark)">
          <path
            d="M 48 5 C 37 5 28 14 28 25 C 28 37 48 56 48 56 C 48 56 68 37 68 25 C 68 14 59 5 48 5 Z"
            fill="url(#neonGreenPinWordmark)"
          />
          <circle cx="48" cy="24" r="6.8" fill={effectiveStrokeColor === '#FFFFFF' ? '#06172E' : '#FFFFFF'} />
        </g>

        {/* Double Track Letters */}
        <g
          stroke={effectiveStrokeColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* 'W' */}
          <path d="M 12 34 L 33 96 L 56 46 L 79 96 L 100 34" />
          <path d="M 22 34 L 37 83 L 56 56 L 75 83 L 90 34" strokeWidth="2.2" />

          {/* 'a' (1) */}
          <circle cx="127" cy="72" r="21" />
          <path d="M 148 51 L 148 93 C 148 95 151 96 153 96" />
          <circle cx="127" cy="72" r="13" strokeWidth="2.2" />

          {/* 'd' */}
          <circle cx="184" cy="72" r="21" />
          <path d="M 205 22 L 205 93 C 205 95 208 96 210 96" />
          <circle cx="184" cy="72" r="13" strokeWidth="2.2" />

          {/* 'a' (2) */}
          <circle cx="241" cy="72" r="21" />
          <path d="M 262 51 L 262 93 C 262 95 265 96 267 96" />
          <circle cx="241" cy="72" r="13" strokeWidth="2.2" />

          {/* 'a' (3) */}
          <circle cx="298" cy="72" r="21" />
          <path d="M 319 51 L 319 93 C 319 95 322 96 324 96" />
          <circle cx="298" cy="72" r="13" strokeWidth="2.2" />

          {/* 'g' */}
          <circle cx="354" cy="72" r="20" />
          <path d="M 374 52 L 374 94 C 374 110 354 114 340 108" />
          <circle cx="354" cy="72" r="12" strokeWidth="2.2" />

          {/* 'e' */}
          <path d="M 432 76 C 432 58 418 51 402 51 C 384 51 372 63 372 75 C 372 89 384 96 402 96 C 416 96 426 90 430 84" />
          <path d="M 422 76 C 422 66 414 60 402 60 C 392 60 382 68 382 75 C 382 83 392 88 402 88 C 412 88 418 84 420 80" strokeWidth="2.2" />
        </g>

        {/* Lime Speed Bars inside 'e' */}
        <line x1="388" y1="69" x2="436" y2="69" stroke="#00E676" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="388" y1="77" x2="436" y2="77" stroke="#00E676" strokeWidth="4.5" strokeLinecap="round" />

        {/* Subtitle: "— Share —" or "Darawell" */}
        {isDriver ? (
          <g transform="translate(140, 116)">
            <line x1="0" y1="8" x2="32" y2="8" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
            <text x="44" y="14" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="17" fontWeight="900" fill="#00E676" letterSpacing="2">
              DARALAY
            </text>
            <line x1="150" y1="8" x2="182" y2="8" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          <g transform="translate(130, 116)">
            {/* 3 Green Speed Lines */}
            <line x1="0" y1="3" x2="22" y2="3" stroke="#00E676" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="6" y1="9" x2="30" y2="9" stroke="#00E676" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="12" y1="15" x2="28" y2="15" stroke="#00E676" strokeWidth="2.6" strokeLinecap="round" />

            {/* Word "Share" */}
            <text x="42" y="14" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="18" fontWeight="900" fill="#00E676" letterSpacing="1.8">
              Share
            </text>

            {/* Speed Extension Bar to the right */}
            <line x1="120" y1="9" x2="190" y2="9" stroke="#00E676" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  };

  // 2. Circular Emblem Badge
  const renderBadgeSVG = () => {
    return (
      <div className={`relative ${dim.badge} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-visible"
        >
          <defs>
            <radialGradient id={`badgeBg_${isDriver ? 'd' : 'r'}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a1e38" />
              <stop offset="65%" stopColor="#040e1c" />
              <stop offset="100%" stopColor="#020710" />
            </radialGradient>
            <linearGradient id={`orbitGB_${isDriver ? 'd' : 'r'}`} x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="35%" stopColor="#00E676" />
              <stop offset="70%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#0077B6" />
            </linearGradient>
            <linearGradient id={`limePin_${isDriver ? 'd' : 'r'}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="60%" stopColor="#00E676" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>
            <filter id={`neonGlow_${isDriver ? 'd' : 'r'}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E676" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Deep Navy/Black Canvas */}
          <circle cx="160" cy="160" r="150" fill={`url(#badgeBg_${isDriver ? 'd' : 'r'})`} />

          {/* Outer Glowing Halo Rings */}
          <circle cx="160" cy="160" r="142" stroke={`url(#orbitGB_${isDriver ? 'd' : 'r'})`} strokeWidth="5" fill="none" />
          <circle cx="160" cy="160" r="130" stroke="#00E676" strokeOpacity="0.5" strokeWidth="2.5" strokeDasharray="14 8 35 12" fill="none" />

          {/* Top Pin Over Car */}
          <g filter={`url(#neonGlow_${isDriver ? 'd' : 'r'})`}>
            <path
              d="M 160 36 C 147 36 137 46 137 59 C 137 74 160 97 160 97 C 160 97 183 74 183 59 C 183 46 173 36 160 36 Z"
              fill={`url(#limePin_${isDriver ? 'd' : 'r'})`}
            />
            <circle cx="160" cy="57" r="8" fill="#040e1c" />
          </g>

          {/* Car with 3 Passengers */}
          <g stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path
              d="M 108 116 C 114 93 128 82 144 80 L 176 80 C 192 82 206 93 212 116 C 218 120 226 124 226 132 C 226 138 220 143 216 144 L 216 156 L 196 156 L 196 153 C 174 155 146 155 124 153 L 124 156 L 104 156 L 104 144 C 100 143 94 138 94 132 C 94 124 102 120 108 116 Z"
              fill="#06182c"
            />
            <path d="M 112 115 L 208 115" strokeWidth="3" />

            <circle cx="132" cy="107" r="7" fill="#FFFFFF" />
            <circle cx="160" cy="103" r="8.5" fill="#FFFFFF" />
            <circle cx="188" cy="107" r="7" fill="#FFFFFF" />

            <path d="M 104 136 C 110 137 116 141 118 145" stroke="#00E676" strokeWidth="4" />
            <path d="M 216 136 C 210 137 204 141 202 145" stroke="#00E676" strokeWidth="4" />
            <path d="M 142 145 L 178 145" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>

          {/* Arch Under Car */}
          <path d="M 64 174 C 115 158, 205 158, 256 174" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* 'wadaage' Typography in Badge */}
          <g transform="translate(14, 150) scale(0.65)">
            <path
              d="M 52 10 C 40 10 30 20 30 32 C 30 46 52 66 52 66 C 52 66 74 46 74 32 C 74 20 64 10 52 10 Z"
              fill="#00E676"
            />
            <circle cx="52" cy="30" r="7.5" fill="#040e1c" />

            <g stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 16 38 L 38 106 L 63 50 L 88 106 L 110 38" />
              <path d="M 27 40 L 43 90 L 63 60 L 83 90 L 99 40" strokeWidth="2.5" />

              <circle cx="138" cy="78" r="22" />
              <path d="M 160 56 L 160 100" />
              <circle cx="198" cy="78" r="22" />
              <path d="M 220 26 L 220 100" />
              <circle cx="258" cy="78" r="22" />
              <path d="M 280 56 L 280 100" />
              <circle cx="318" cy="78" r="22" />
              <path d="M 340 56 L 340 100" />
              <circle cx="376" cy="78" r="21" />
              <path d="M 397 57 L 397 101 C 397 118 375 122 360 116" />
              <path d="M 456 82 C 456 62 441 54 424 54 C 404 54 391 67 391 80 C 391 96 404 104 424 104" />
            </g>

            <line x1="409" y1="75" x2="458" y2="75" stroke="#00E676" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="409" y1="84" x2="458" y2="84" stroke="#00E676" strokeWidth="5.5" strokeLinecap="round" />
          </g>

          {/* Subtitle Inside Badge */}
          {isDriver ? (
            <g transform="translate(100, 235)">
              <line x1="0" y1="9" x2="20" y2="9" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
              <text x="28" y="14" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="15" fontWeight="900" fill="#00E676" letterSpacing="1.5">
                DARALAY
              </text>
              <line x1="102" y1="9" x2="122" y2="9" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="translate(85, 235)">
              <line x1="0" y1="5" x2="16" y2="5" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="10" x2="22" y2="10" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="15" x2="20" y2="15" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
              <text x="34" y="14" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontSize="16" fontWeight="900" fill="#00E676" letterSpacing="1.5">
                Share
              </text>
              <line x1="96" y1="10" x2="145" y2="10" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Bottom Arc */}
          <path d="M 100 270 C 135 280, 185 280, 220 270" stroke={`url(#orbitGB_${isDriver ? 'd' : 'r'})`} strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  };

  // 3. Icon Mode (Circular Icon Badge)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${dim.icon} ${className}`}>
        {renderBadgeSVG()}
      </div>
    );
  }

  // 4. Badge / Full Mode
  if (variant === 'badge' || variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        {renderBadgeSVG()}
        {showTagline && (
          <span className="mt-2 text-xs font-black tracking-wider text-emerald-500 uppercase">
            {isDriver ? 'Darawell Fleet Somaliland' : 'Share the ride. Save more.'}
          </span>
        )}
      </div>
    );
  }

  // 5. Header / Wordmark Mode
  return (
    <div
      className={`inline-flex items-center space-x-2 select-none ${
        theme === 'dark'
          ? 'bg-[#08162b] px-3 py-1.5 rounded-2xl border border-slate-800 shadow-md'
          : theme === 'light'
          ? 'bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm'
          : ''
      } ${className}`}
    >
      {renderWordmarkSVG()}
    </div>
  );
};
