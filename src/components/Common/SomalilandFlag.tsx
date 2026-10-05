import React from 'react';

interface SomalilandFlagProps {
  className?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
}

export const SomalilandFlag: React.FC<SomalilandFlagProps> = ({
  className = 'w-5 h-3.5',
  size,
  width,
  height,
  rounded = true,
}) => {
  const computedWidth = width || (size ? size * 1.5 : undefined);
  const computedHeight = height || size;

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-black/10 select-none ${
        rounded ? 'rounded-xs' : ''
      } ${className}`}
      style={{ width: computedWidth, height: computedHeight }}
      title="Somaliland Flag"
    >
      <svg
        viewBox="0 0 600 300"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Stripe: Somaliland Green */}
        <rect width="600" height="100" fill="#008751" />

        {/* Arabic Shahadah Inscription stylized in White on Green */}
        <g fill="#FFFFFF" transform="translate(300, 52) scale(0.7)">
          <text
            x="0"
            y="12"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="32"
            letterSpacing="2"
          >
            لا إِلٰهَ إِلَّا الله مُحَمَّدٌ رَسُولُ الله
          </text>
        </g>

        {/* Middle Stripe: Pure White */}
        <rect y="100" width="600" height="100" fill="#FFFFFF" />

        {/* Center: Black 5-Pointed Star */}
        <polygon
          points="300,118 312,154 350,154 319,176 331,212 300,190 269,212 281,176 250,154 288,154"
          fill="#000000"
        />

        {/* Bottom Stripe: Somaliland Red */}
        <rect y="200" width="600" height="100" fill="#D21034" />
      </svg>
    </span>
  );
};
