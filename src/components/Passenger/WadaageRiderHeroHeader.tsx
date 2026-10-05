import React from 'react';
import { Menu, Bell } from 'lucide-react';

interface WadaageRiderHeroHeaderProps {
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

export const WadaageRiderHeroHeader: React.FC<WadaageRiderHeroHeaderProps> = ({
  onOpenMenu,
  onOpenNotifications,
}) => {
  return (
    <header className="relative w-full overflow-hidden select-none bg-slate-900 shrink-0 z-30 shadow-md">
      {/* 1. Background City Twilight Skyline Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/wadaage_hero_hargeisa.jpg"
          alt="Hargeisa Twilight Skyline"
          className="w-full h-full object-cover object-center filter contrast-110 brightness-90"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        {/* Evening Sky Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* 2. Compact Brand Bar (Menu Button | Wadaage Logo & Tagline | Notification Button) */}
      <div className="relative z-20 px-3 py-2 flex items-center justify-between">
        {/* Left: Round Blue Menu Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-9 h-9 rounded-full bg-[#0077E6]/90 hover:bg-[#0077E6] active:scale-90 backdrop-blur-md flex items-center justify-center text-white shadow-md transition border border-white/20 cursor-pointer shrink-0"
          aria-label="Fura Liiska (Open Menu)"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center: Compact Wadaage Brand Identity */}
        <div className="flex items-center space-x-2 px-2">
          {/* Wadaage Lime Pin Logo */}
          <div className="relative shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 44 54" className="w-6 h-7" fill="none">
              <path
                d="M22 2C10.95 2 2 10.95 2 22C2 37 22 52 22 52S42 37 42 22C42 10.95 33.05 2 22 2Z"
                fill="#76D600"
              />
              <circle cx="22" cy="21" r="9" fill="#0077E6" />
              <circle cx="22" cy="21" r="4" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="flex flex-col items-start leading-none">
            <div className="flex items-baseline space-x-1.5">
              <span
                className="text-xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", -apple-system, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Wadaage
              </span>
              <span
                className="text-[9px] font-black tracking-widest text-[#C6F200] uppercase bg-[#C6F200]/15 px-1.5 py-0.5 rounded border border-[#C6F200]/30"
              >
                TAXI & WADAAG
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium tracking-wide mt-0.5">
              Hargeisa • Dadka isku xidh, safarka fududee
            </span>
          </div>
        </div>

        {/* Right: Round Blue Notifications Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-full bg-[#0077E6]/90 hover:bg-[#0077E6] active:scale-90 backdrop-blur-md flex items-center justify-center text-white shadow-md transition border border-white/20 cursor-pointer shrink-0"
          aria-label="Ogaysiisyada (Notifications)"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
        </button>
      </div>

      {/* 3. Subtle Sleek Dual-Color Wave Accent (Lime Green & Electric Blue) */}
      <div className="relative w-full leading-none z-20 pointer-events-none -mb-[1px]">
        <svg
          viewBox="0 0 1440 40"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-2 block"
        >
          {/* Lime Green Accent Wave */}
          <path
            d="M0,10 C320,35 640,-10 960,25 C1200,45 1360,10 1440,20 L1440,40 L0,40 Z"
            fill="#76D600"
            opacity="0.9"
          />
          {/* Electric Blue Wave */}
          <path
            d="M0,20 C360,40 700,5 1020,30 C1240,45 1380,20 1440,25 L1440,40 L0,40 Z"
            fill="#0077E6"
          />
        </svg>
      </div>
    </header>
  );
};

