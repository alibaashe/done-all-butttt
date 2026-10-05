import React from 'react';
import { resolveVehicleColor } from '../../utils/vehicleColors';

interface RealisticVehicleMarkerProps {
  color?: string;
  model?: string;
  licensePlate?: string;
  driverName?: string;
  heading?: number;
  isAssigned?: boolean;
  isLiveGps?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RealisticVehicleMarker: React.FC<RealisticVehicleMarkerProps> = ({
  color = 'White',
  model = 'Toyota Vitz',
  licensePlate,
  driverName,
  heading = 0,
  isAssigned = false,
  isLiveGps = false,
  showDetails = false,
  size = 'md',
}) => {
  const colorDef = resolveVehicleColor(color);

  // Determine chassis dimensions based on size prop
  const dimensions =
    size === 'sm'
      ? { width: 34, height: 56, scale: 0.85 }
      : size === 'lg'
      ? { width: 44, height: 72, scale: 1.15 }
      : { width: 38, height: 62, scale: 1.0 };

  const isVitzOrHatch =
    model.toLowerCase().includes('vitz') ||
    model.toLowerCase().includes('passo') ||
    model.toLowerCase().includes('swift') ||
    model.toLowerCase().includes('fit') ||
    model.toLowerCase().includes('note');

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none group">
      {/* Floating Info Badge (For Assigned Driver or Admin View) */}
      {showDetails && (
        <div className="mb-1.5 flex flex-col items-center z-30 animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`px-2 py-0.5 rounded-lg shadow-xl text-[10px] font-black border flex items-center gap-1 whitespace-nowrap ${
              isAssigned
                ? 'bg-slate-950 text-white border-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-100 border-slate-700'
            }`}
          >
            {isAssigned && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            )}
            <span
              className="w-2 h-2 rounded-full inline-block border border-black/30 shadow-xs"
              style={{ backgroundColor: colorDef.hex }}
            />
            <span>{driverName ? driverName.split(' ')[0] : 'Driver'}</span>
            <span className="text-slate-400 font-semibold">•</span>
            <span className="text-emerald-400 font-extrabold">{model.split(' ')[1] || model.split(' ')[0]}</span>
            {licensePlate && (
              <span className="text-slate-300 font-mono text-[9px] bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
                {licensePlate}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Target Halo Glow for Live Active Driver */}
      {isAssigned && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
      )}

      {/* Realistic Top-Down Rotating Car Body */}
      <div
        className="relative transition-transform duration-300 ease-out will-change-transform drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
        style={{
          transform: `rotate(${heading}deg)`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        {/* Headlight Beam Glow (Night / Road illumination cone) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-24 h-16 pointer-events-none opacity-40 bg-gradient-to-t from-yellow-200/40 via-yellow-100/10 to-transparent clip-triangle" />

        <svg
          viewBox="0 0 100 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Paint Gradient based on Driver's registered color */}
            <linearGradient id={`carPaint_${colorDef.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorDef.hex} />
              <stop offset="60%" stopColor={colorDef.hex} />
              <stop offset="100%" stopColor={colorDef.secondaryHex} />
            </linearGradient>

            {/* Gloss Highlight on Roof / Hood */}
            <linearGradient id="glossHighlight" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </linearGradient>

            {/* Glass Windshield Gradient */}
            <linearGradient id="windshieldGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="40%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Glass Reflection streak */}
            <linearGradient id="glassStreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* 1. Ground Shadow */}
          <ellipse cx="50" cy="85" rx="42" ry="70" fill="#000000" fillOpacity="0.35" />

          {/* 2. Wheels / Tires (Top-Down 4 Wheels) */}
          {/* Front Left */}
          <rect x="8" y="28" width="9" height="22" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          {/* Front Right */}
          <rect x="83" y="28" width="9" height="22" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          {/* Rear Left */}
          <rect x="8" y="112" width="9" height="22" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          {/* Rear Right */}
          <rect x="83" y="112" width="9" height="22" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

          {/* 3. Main Car Chassis Body (Colored in Real Registered Vehicle Color) */}
          <path
            d={
              isVitzOrHatch
                ? 'M 25 15 C 36 8, 64 8, 75 15 C 84 22, 88 45, 87 75 C 87 110, 85 140, 77 148 C 65 154, 35 154, 23 148 C 15 140, 13 110, 13 75 C 12 45, 16 22, 25 15 Z'
                : 'M 24 12 C 36 6, 64 6, 76 12 C 85 20, 87 50, 87 85 C 87 122, 86 146, 76 152 C 64 156, 36 156, 24 152 C 14 146, 13 122, 13 85 C 13 50, 15 20, 24 12 Z'
            }
            fill={`url(#carPaint_${colorDef.id})`}
            stroke={colorDef.borderHex}
            strokeWidth="2"
          />

          {/* 4. Gloss Surface Overlay */}
          <path
            d={
              isVitzOrHatch
                ? 'M 25 15 C 36 8, 64 8, 75 15 C 84 22, 88 45, 87 75 C 87 110, 85 140, 77 148 C 65 154, 35 154, 23 148 C 15 140, 13 110, 13 75 C 12 45, 16 22, 25 15 Z'
                : 'M 24 12 C 36 6, 64 6, 76 12 C 85 20, 87 50, 87 85 C 87 122, 86 146, 76 152 C 64 156, 36 156, 24 152 C 14 146, 13 122, 13 85 C 13 50, 15 20, 24 12 Z'
            }
            fill="url(#glossHighlight)"
          />

          {/* 5. Hood Aerodynamic Contour Grooves */}
          <path d="M 32 20 C 35 34, 35 44, 35 48" stroke={colorDef.isDark ? '#475569' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 68 20 C 65 34, 65 44, 65 48" stroke={colorDef.isDark ? '#475569' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" />

          {/* 6. Side Mirrors */}
          {/* Left Mirror */}
          <path d="M 13 50 L 5 46 C 4 44, 5 40, 8 40 L 14 44 Z" fill={`url(#carPaint_${colorDef.id})`} stroke={colorDef.borderHex} strokeWidth="1" />
          {/* Right Mirror */}
          <path d="M 87 50 L 95 46 C 96 44, 95 40, 92 40 L 86 44 Z" fill={`url(#carPaint_${colorDef.id})`} stroke={colorDef.borderHex} strokeWidth="1" />

          {/* 7. Front Windshield */}
          <path
            d="M 23 52 C 35 48, 65 48, 77 52 C 78 54, 76 74, 74 76 C 60 73, 40 73, 26 76 C 24 74, 22 54, 23 52 Z"
            fill="url(#windshieldGlass)"
            stroke="#020617"
            strokeWidth="1.2"
          />
          {/* Windshield Light Reflection */}
          <path d="M 28 54 L 46 51 L 38 72 L 29 73 Z" fill="url(#glassStreak)" />

          {/* 8. Car Roof / Sunroof Panel */}
          <rect
            x="27"
            y="76"
            width="46"
            height={isVitzOrHatch ? '38' : '44'}
            rx="5"
            fill={`url(#carPaint_${colorDef.id})`}
            stroke={colorDef.borderHex}
            strokeWidth="1"
          />

          {/* Roof Ridge Grooves */}
          <line x1="34" y1="80" x2="34" y2={isVitzOrHatch ? '108' : '114'} stroke={colorDef.isDark ? '#334155' : '#CBD5E1'} strokeWidth="1" />
          <line x1="66" y1="80" x2="66" y2={isVitzOrHatch ? '108' : '114'} stroke={colorDef.isDark ? '#334155' : '#CBD5E1'} strokeWidth="1" />

          {/* 9. Rear Window */}
          <path
            d={
              isVitzOrHatch
                ? 'M 26 116 C 36 114, 64 114, 74 116 C 75 118, 73 132, 70 134 C 58 132, 42 132, 30 134 C 27 132, 25 118, 26 116 Z'
                : 'M 26 122 C 36 120, 64 120, 74 122 C 75 124, 73 138, 70 140 C 58 138, 42 138, 30 140 C 27 138, 25 124, 26 122 Z'
            }
            fill="url(#windshieldGlass)"
            stroke="#020617"
            strokeWidth="1"
          />

          {/* 10. Front Headlights (Bright Xenon/LED Yellow Glow) */}
          <path d="M 18 16 C 21 13, 29 13, 31 16 C 29 22, 21 24, 18 21 Z" fill="#FEF08A" stroke="#FACC15" strokeWidth="1" />
          <circle cx="24" cy="17" r="3" fill="#FFFFFF" />
          <path d="M 82 16 C 79 13, 71 13, 69 16 C 71 22, 79 24, 82 21 Z" fill="#FEF08A" stroke="#FACC15" strokeWidth="1" />
          <circle cx="76" cy="17" r="3" fill="#FFFFFF" />

          {/* 11. Rear Tail Lights (Brake Lights) */}
          <path d="M 18 144 C 21 146, 27 146, 28 144 C 27 149, 21 150, 18 147 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
          <path d="M 82 144 C 79 146, 73 146, 72 144 C 73 149, 79 150, 82 147 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />

          {/* 12. Model Badge / Plate on Trunk */}
          <rect x="38" y="146" width="24" height="6" rx="1.5" fill="#0F172A" stroke="#334155" strokeWidth="0.5" />
          <text x="50" y="151" fill="#FFFFFF" fontSize="4.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            {licensePlate ? licensePlate.substring(0, 7) : isVitzOrHatch ? 'VITZ' : 'WADAAGE'}
          </text>
        </svg>
      </div>
    </div>
  );
};
