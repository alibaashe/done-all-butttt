import React from 'react';

interface VehicleIllustrationProps {
  type: 'wadaage' | 'taxi' | 'moto' | 'vip' | 'logo';
  className?: string;
}

export const VehicleIllustration: React.FC<VehicleIllustrationProps> = ({ type, className = 'w-16 h-12' }) => {
  if (type === 'logo') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,229,117,0.4)]">
          <defs>
            <linearGradient id="ringGradVeh" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E575" />
              <stop offset="45%" stopColor="#00C853" />
              <stop offset="75%" stopColor="#0099FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>
            <radialGradient id="vehBadgeBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#052438" />
              <stop offset="100%" stopColor="#02101B" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#vehBadgeBg)" />
          <circle cx="50" cy="50" r="43" stroke="url(#ringGradVeh)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M50 9C45.5 9 42 12.5 42 17C42 22 50 29 50 29C50 29 58 22 58 17C58 12.5 54.5 9 50 9Z" fill="#00E575" />
          <circle cx="50" cy="16" r="2.8" fill="#02101B" />
          <path d="M28 54L35 34C36.5 30 40 28 44 28H56C60 28 63.5 30 65 34L72 54C75 55.5 77 58 77 62V71C77 73 75.5 74.5 73.5 74.5H69V70H31V74.5H26.5C24.5 74.5 23 73 23 71V62C23 58 25 55.5 28 54Z" fill="white" />
          <path d="M37 34L32 50H68L63 34C62 31.5 59.5 30 57 30H43C40.5 30 38 31.5 37 34Z" fill="#021422" />
          <circle cx="50" cy="40" r="3.6" fill="white" />
          <circle cx="39" cy="42" r="2.8" fill="white" />
          <circle cx="61" cy="42" r="2.8" fill="white" />
          <ellipse cx="32" cy="60" rx="3.5" ry="2.2" fill="#00E575" />
          <ellipse cx="68" cy="60" rx="3.5" ry="2.2" fill="#00E575" />
        </svg>
      </div>
    );
  }

  if (type === 'moto') {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
          {/* Scooter / Mooto vector */}
          <circle cx="28" cy="52" r="14" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
          <circle cx="28" cy="52" r="7" fill="#94A3B8" />
          <circle cx="92" cy="52" r="14" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
          <circle cx="92" cy="52" r="7" fill="#94A3B8" />

          {/* Chassis */}
          <path d="M28 52L44 38L65 42L82 48L92 52" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <path d="M44 38L52 20L42 16" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
          <path d="M52 20L62 20" stroke="#008751" strokeWidth="3.5" strokeLinecap="round" />

          {/* Body and Seat */}
          <path d="M50 36C50 36 56 30 70 30C82 30 86 36 86 44L60 44L50 36Z" fill="#0F172A" />
          <path d="M54 30C58 26 72 26 80 30L54 30Z" fill="#008751" />
          {/* Headlight */}
          <ellipse cx="40" cy="18" rx="4" ry="3" fill="#FACC15" />
        </svg>
      </div>
    );
  }

  if (type === 'vip') {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
          {/* Luxury Sedan */}
          <path
            d="M15 46C15 46 22 36 38 32C52 28 66 18 85 18C110 18 128 28 142 34C152 38 155 45 155 48L145 52H25L15 46Z"
            fill="#0F172A"
          />
          {/* Windows */}
          <path d="M55 24L75 24L75 33L48 33C50 30 52 26 55 24Z" fill="#38BDF8" fillOpacity="0.8" />
          <path d="M80 24L110 24C118 27 122 30 126 33L80 33V24Z" fill="#38BDF8" fillOpacity="0.8" />
          {/* Gold VIP Accent Stripe */}
          <path d="M22 42H148" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Wheels */}
          <circle cx="42" cy="52" r="13" fill="#0F172A" stroke="#475569" strokeWidth="3" />
          <circle cx="42" cy="52" r="6" fill="#F59E0B" />
          <circle cx="126" cy="52" r="13" fill="#0F172A" stroke="#475569" strokeWidth="3" />
          <circle cx="126" cy="52" r="6" fill="#F59E0B" />
          {/* Lights */}
          <path d="M150 42L155 44" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 42L15 44" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Wadaage / Standard Taxi
  const isWadaageShare = type === 'wadaage';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        {/* Shadow */}
        <ellipse cx="84" cy="62" rx="66" ry="6" fill="#000000" fillOpacity="0.12" />

        {/* Car Body - Clean White Sedan */}
        <path
          d="M16 45C16 45 22 36 38 31C52 26 66 16 85 16C108 16 126 26 140 32C150 36 154 44 154 48L145 52H25L16 45Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Windows */}
        <path d="M52 22L75 22L75 32L46 32C48 28 50 24 52 22Z" fill="#93C5FD" fillOpacity="0.85" stroke="#64748B" strokeWidth="1" />
        <path d="M79 22L112 22C120 25 125 28 128 32L79 32V22Z" fill="#93C5FD" fillOpacity="0.85" stroke="#64748B" strokeWidth="1" />

        {/* Green Wadaage Signature Stripe (Top and Side) */}
        {isWadaageShare ? (
          <>
            <path d="M68 16L102 16" stroke="#00B14F" strokeWidth="4" strokeLinecap="round" />
            <path d="M22 41H148" stroke="#00B14F" strokeWidth="3" strokeLinecap="round" />
            {/* Green License Plate */}
            <rect x="144" y="44" width="10" height="5" rx="1.5" fill="#00B14F" />
          </>
        ) : (
          <>
            {/* Standard Taxi subtle styling */}
            <path d="M68 16L102 16" stroke="#008751" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M22 41H148" stroke="#008751" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="144" y="44" width="10" height="5" rx="1.5" fill="#008751" />
          </>
        )}

        {/* Front & Rear Lights */}
        <path d="M151 40C153 41 154 43 154 45" stroke="#FACC15" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M17 40C16 41 16 43 16 45" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />

        {/* Wheels */}
        <circle cx="42" cy="52" r="12" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
        <circle cx="42" cy="52" r="5" fill="#CBD5E1" />
        <circle cx="126" cy="52" r="12" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
        <circle cx="126" cy="52" r="5" fill="#CBD5E1" />
      </svg>
    </div>
  );
};
