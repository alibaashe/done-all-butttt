import React from 'react';
import { resolveVehicleColor } from '../../utils/vehicleColors';

interface RealisticCarGraphicProps {
  color?: string;
  model?: string;
  className?: string;
  badge?: string;
}

export const RealisticCarGraphic: React.FC<RealisticCarGraphicProps> = ({
  color = 'White',
  model = 'Toyota Vitz',
  className = 'w-24 h-14',
  badge,
}) => {
  const colorDef = resolveVehicleColor(color);

  const isHatch =
    model.toLowerCase().includes('vitz') ||
    model.toLowerCase().includes('passo') ||
    model.toLowerCase().includes('swift') ||
    model.toLowerCase().includes('fit') ||
    model.toLowerCase().includes('note');

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain filter drop-shadow-md"
      >
        <defs>
          <linearGradient id={`sideCarPaint_${colorDef.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorDef.hex} />
            <stop offset="65%" stopColor={colorDef.hex} />
            <stop offset="100%" stopColor={colorDef.secondaryHex} />
          </linearGradient>

          <linearGradient id="sideGloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id="sideGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* 1. Ground Shadow */}
        <ellipse cx="80" cy="72" rx="68" ry="6" fill="#000000" fillOpacity="0.25" />

        {/* 2. Main Car Chassis Profile */}
        <path
          d={
            isHatch
              ? 'M 18 56 C 16 52 18 45 28 44 C 36 43 45 32 60 22 C 75 16 95 16 112 18 C 124 24 135 34 142 42 C 148 46 150 52 148 56 L 138 58 C 136 50 120 50 118 58 L 52 58 C 50 50 34 50 32 58 Z'
              : 'M 14 56 C 14 48 22 44 38 42 C 50 40 62 20 86 20 C 110 20 126 30 140 38 C 150 42 154 48 152 56 L 138 58 C 136 50 120 50 118 58 L 52 58 C 50 50 34 50 32 58 Z'
          }
          fill={`url(#sideCarPaint_${colorDef.id})`}
          stroke={colorDef.borderHex}
          strokeWidth="1.5"
        />

        {/* Gloss highlight */}
        <path
          d={
            isHatch
              ? 'M 18 56 C 16 52 18 45 28 44 C 36 43 45 32 60 22 C 75 16 95 16 112 18 C 124 24 135 34 142 42 C 148 46 150 52 148 56 L 138 58 C 136 50 120 50 118 58 L 52 58 C 50 50 34 50 32 58 Z'
              : 'M 14 56 C 14 48 22 44 38 42 C 50 40 62 20 86 20 C 110 20 126 30 140 38 C 150 42 154 48 152 56 L 138 58 C 136 50 120 50 118 58 L 52 58 C 50 50 34 50 32 58 Z'
          }
          fill="url(#sideGloss)"
        />

        {/* 3. Windows / Greenhouse */}
        {/* Front windshield & side window */}
        <path
          d="M 52 40 L 64 24 L 88 24 L 88 40 Z"
          fill="url(#sideGlass)"
          stroke="#0F172A"
          strokeWidth="1"
        />
        {/* Front window reflection */}
        <path d="M 56 38 L 65 26 L 72 26 L 63 38 Z" fill="#38BDF8" fillOpacity="0.4" />

        {/* Rear side window */}
        <path
          d={
            isHatch
              ? 'M 92 24 L 112 24 C 118 28 122 34 126 40 L 92 40 Z'
              : 'M 92 24 L 114 24 C 122 28 126 34 130 40 L 92 40 Z'
          }
          fill="url(#sideGlass)"
          stroke="#0F172A"
          strokeWidth="1"
        />

        {/* Door line seam */}
        <line x1="90" y1="24" x2="90" y2="56" stroke={colorDef.borderHex} strokeWidth="1.2" />
        <line x1="52" y1="40" x2="52" y2="56" stroke={colorDef.borderHex} strokeWidth="1.2" />

        {/* Door Handles */}
        <rect x="74" y="44" width="7" height="2" rx="1" fill={colorDef.isDark ? '#E2E8F0' : '#1E293B'} />
        <rect x="98" y="44" width="7" height="2" rx="1" fill={colorDef.isDark ? '#E2E8F0' : '#1E293B'} />

        {/* 4. Headlights & Taillights */}
        {/* Front Headlight */}
        <path d="M 144 44 C 148 45 150 48 149 52 L 140 52 Z" fill="#FEF08A" stroke="#FACC15" strokeWidth="1" />
        {/* Rear Taillight */}
        <path d="M 16 46 C 15 48 16 52 19 54 L 24 54 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />

        {/* 5. Wheels (Alloy Rims + Rubber Tires) */}
        {/* Front Wheel */}
        <circle cx="128" cy="58" r="13" fill="#0F172A" stroke="#334155" strokeWidth="2.5" />
        <circle cx="128" cy="58" r="7" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="128" cy="58" r="3" fill="#0F172A" />

        {/* Rear Wheel */}
        <circle cx="42" cy="58" r="13" fill="#0F172A" stroke="#334155" strokeWidth="2.5" />
        <circle cx="42" cy="58" r="7" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="42" cy="58" r="3" fill="#0F172A" />
      </svg>

      {/* Optional floating badge (e.g. "Vitz • Blue") */}
      {badge && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/90 text-[9px] font-extrabold text-white px-1.5 py-0.2 rounded border border-slate-700 whitespace-nowrap shadow-sm">
          {badge}
        </div>
      )}
    </div>
  );
};
