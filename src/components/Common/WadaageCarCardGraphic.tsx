import React from 'react';

interface WadaageCarCardGraphicProps {
  type: 'wadaage' | 'taxi';
  className?: string;
}

export const WadaageCarCardGraphic: React.FC<WadaageCarCardGraphicProps> = ({
  type,
  className = 'w-full h-16',
}) => {
  const isTaxi = type === 'taxi';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 240 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        <defs>
          {/* Radial drop shadow under car */}
          <radialGradient id={`carShadow-${type}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#0F172A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>

          {/* White Car Body Gradient */}
          <linearGradient id={`whiteBodyGrad-${type}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="75%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Windshield Tint */}
          <linearGradient id={`windshieldGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="40%" stopColor="#334155" />
            <stop offset="80%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Headlight Glow */}
          <linearGradient id={`headlightGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Wheel Rim Alloy */}
          <linearGradient id={`rimGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* 1. SOFT SHADOW BENEATH CAR */}
        <ellipse cx="118" cy="100" rx="98" ry="12" fill={`url(#carShadow-${type})`} />

        {/* 2. ROOF TAXI SIGN (Only for Normal Taxi) */}
        {isTaxi && (
          <g id="taxi-roof-sign">
            {/* Base mount */}
            <rect x="108" y="24" width="28" height="4" rx="1.5" fill="#334155" />
            {/* Yellow Illuminated Sign */}
            <path
              d="M 104 25 C 104 22, 107 19, 111 19 L 133 19 C 137 19, 140 22, 140 25 L 138 28 C 138 29, 136 30, 134 30 L 110 30 C 108 30, 106 29, 106 28 Z"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="1"
            />
            {/* TAXI Text */}
            <text
              x="122"
              y="27"
              fill="#0F172A"
              fontSize="7"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="sans-serif"
              letterSpacing="0.8"
            >
              TAXI
            </text>
          </g>
        )}

        {/* 3. CAR BODYWORK (3/4 Perspective White Sedan) */}
        <g id="car-body">
          {/* Main Hull & Side Profile */}
          <path
            d="M 28 78
               C 27 75, 29 70, 34 66
               L 52 58
               C 62 53, 76 46, 92 38
               C 106 32, 126 30, 148 30
               C 170 30, 186 36, 198 44
               C 204 48, 208 53, 212 58
               L 219 66
               C 223 70, 224 74, 222 78
               L 220 83
               C 219 86, 215 88, 211 88
               L 194 88
               C 192 81, 185 75, 175 75
               C 165 75, 158 81, 156 88
               L 82 88
               C 80 81, 73 75, 63 75
               C 53 75, 46 81, 44 88
               L 29 88
               C 25 88, 23 85, 24 81
               Z"
            fill={`url(#whiteBodyGrad-${type})`}
            stroke="#94A3B8"
            strokeWidth="1.2"
          />

          {/* Front Bumper & Lower Air Intake */}
          <path
            d="M 26 78 C 28 83, 34 86, 44 86 L 46 88 L 29 88 C 24 88, 23 83, 26 78 Z"
            fill="#334155"
          />
          {/* Lower Grille Mesh */}
          <path d="M 33 80 L 46 80 L 45 83 L 34 83 Z" fill="#0F172A" />

          {/* Windows / Cabin Glass */}
          {/* Front Windshield */}
          <path
            d="M 56 57
               L 88 39
               C 98 35, 114 33, 128 33
               L 128 56
               L 56 57 Z"
            fill={`url(#windshieldGrad-${type})`}
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Rear Window & Rear Quarter */}
          <path
            d="M 132 33
               C 148 33, 166 36, 178 41
               L 190 51
               C 194 54, 196 56, 196 56
               L 132 56
               Z"
            fill={`url(#windshieldGrad-${type})`}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Window Pillar Separator (B-Pillar) */}
          <line x1="130" y1="32" x2="130" y2="57" stroke="#334155" strokeWidth="2.5" />

          {/* Hood Crease Line */}
          <path
            d="M 36 67 C 50 63, 68 59, 86 56"
            stroke="#CBD5E1"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Door Crease Line & Handle */}
          <path
            d="M 94 60 L 92 84 M 146 59 L 144 83"
            stroke="#CBD5E1"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Front & Rear Door Handles */}
          <rect x="100" y="63" width="8" height="2" rx="1" fill="#64748B" />
          <rect x="150" y="62" width="8" height="2" rx="1" fill="#64748B" />

          {/* Side Mirror */}
          <path
            d="M 85 54 C 83 52, 85 49, 89 50 L 93 52 C 94 53, 94 55, 92 56 L 88 56 Z"
            fill="#FFFFFF"
            stroke="#64748B"
            strokeWidth="0.8"
          />

          {/* Headlight Assembly (Sharp Aerodynamic Modern Cluster) */}
          <path
            d="M 28 73 C 27 69, 31 66, 36 65 L 48 63 C 44 68, 38 72, 32 74 Z"
            fill={`url(#headlightGrad-${type})`}
            stroke="#0284C7"
            strokeWidth="0.8"
          />
          {/* Headlight projector pupil */}
          <circle cx="34" cy="69" r="2.2" fill="#FFFFFF" />

          {/* Tail light edge */}
          <path
            d="M 214 62 C 218 64, 221 68, 220 72 L 214 71 Z"
            fill="#EF4444"
          />

          {/* 4. DOOR BADGE FOR WADAAGE (In screenshot: Wadaage Share logo on front door!) */}
          {!isTaxi && (
            <g id="wadaage-door-logo" transform="translate(104, 66) scale(0.22)">
              {/* Outer circle ring */}
              <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#008751" strokeWidth="4" />
              {/* Green left W */}
              <path d="M 20 30 C 20 50, 25 76, 38 84 L 46 54 Z" fill="#008751" />
              {/* Yellow bottom */}
              <path d="M 36 82 C 45 88, 55 88, 64 82 L 50 68 Z" fill="#F59E0B" />
              {/* Blue right W */}
              <path d="M 80 30 C 80 50, 75 76, 62 84 L 54 54 Z" fill="#0066F5" />
              {/* Red Pin & Passengers */}
              <path d="M 50 16 C 42 16, 36 22, 36 30 C 36 40, 50 54, 50 54 C 50 54, 64 40, 64 30 C 64 22, 58 16, 50 16 Z" fill="#EF4444" />
              <circle cx="47" cy="27" r="3.2" fill="#EF4444" />
              <circle cx="53" cy="27" r="3.2" fill="#06B6D4" />
            </g>
          )}

          {/* 5. WHEELS & ALLOY RIMS */}
          {/* Front Left Wheel */}
          <g id="front-wheel">
            {/* Rubber Tire */}
            <circle cx="63" cy="88" r="14" fill="#0F172A" />
            {/* Tire Tread Accent */}
            <circle cx="63" cy="88" r="12.5" stroke="#334155" strokeWidth="1" fill="none" />
            {/* Alloy Rim */}
            <circle cx="63" cy="88" r="9" fill={`url(#rimGrad-${type})`} />
            {/* Center Cap */}
            <circle cx="63" cy="88" r="3.5" fill="#1E293B" />
            {/* Wheel Spokes */}
            <line x1="63" y1="79" x2="63" y2="97" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="54" y1="88" x2="72" y2="88" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="57" y1="82" x2="69" y2="94" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="57" y1="94" x2="69" y2="82" stroke="#CBD5E1" strokeWidth="1.2" />
          </g>

          {/* Rear Left Wheel */}
          <g id="rear-wheel">
            {/* Rubber Tire */}
            <circle cx="175" cy="88" r="14" fill="#0F172A" />
            {/* Tire Tread Accent */}
            <circle cx="175" cy="88" r="12.5" stroke="#334155" strokeWidth="1" fill="none" />
            {/* Alloy Rim */}
            <circle cx="175" cy="88" r="9" fill={`url(#rimGrad-${type})`} />
            {/* Center Cap */}
            <circle cx="175" cy="88" r="3.5" fill="#1E293B" />
            {/* Wheel Spokes */}
            <line x1="175" y1="79" x2="175" y2="97" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="166" y1="88" x2="184" y2="88" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="169" y1="82" x2="181" y2="94" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="169" y1="94" x2="181" y2="82" stroke="#CBD5E1" strokeWidth="1.2" />
          </g>
        </g>
      </svg>
    </div>
  );
};
