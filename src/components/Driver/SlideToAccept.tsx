import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Check, Sparkles } from 'lucide-react';

interface SlideToAcceptProps {
  onAccept: () => void;
  label?: string;
  completedLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const SlideToAccept: React.FC<SlideToAcceptProps> = ({
  onAccept,
  label = 'U siq si aad u aqbasho',
  completedLabel = 'Waa la aqbalay!',
  disabled = false,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);

  // Maximum drag distance calculation
  const getMaxDrag = useCallback((): number => {
    if (!trackRef.current || !handleRef.current) return 200;
    const trackWidth = trackRef.current.clientWidth;
    const handleWidth = handleRef.current.clientWidth;
    return Math.max(0, trackWidth - handleWidth - 8); // 4px padding on each side
  }, []);

  const triggerHaptic = (pattern: number[] = [15, 30, 15]) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handleStart = (clientX: number) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
    triggerHaptic([10]);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || isCompleted) return;
    const maxDrag = getMaxDrag();
    const newPos = Math.min(Math.max(0, clientX - startXRef.current), maxDrag);
    setSliderPosition(newPos);

    // Minor haptic tick as user crosses 50%
    if (newPos > maxDrag * 0.5 && newPos < maxDrag * 0.55) {
      triggerHaptic([8]);
    }

    // Trigger accept if dragged over 85% of track
    if (newPos >= maxDrag * 0.88) {
      setIsDragging(false);
      setIsCompleted(true);
      setSliderPosition(maxDrag);
      triggerHaptic([30, 60, 30]);
      onAccept();
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const maxDrag = getMaxDrag();
    if (sliderPosition < maxDrag * 0.88) {
      // Snap back smoothly
      setSliderPosition(0);
    }
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const onMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, sliderPosition]);

  const maxDrag = getMaxDrag();
  const progressPercent = maxDrag > 0 ? (sliderPosition / maxDrag) * 100 : 0;

  return (
    <div
      ref={trackRef}
      id="driver-slide-to-accept-track"
      className={`relative w-full h-15 rounded-2xl overflow-hidden p-1 select-none flex items-center shadow-lg transition-all ${
        disabled
          ? 'bg-slate-200 opacity-60 cursor-not-allowed'
          : isCompleted
          ? 'bg-[#008751] shadow-emerald-500/30'
          : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 shadow-emerald-900/30'
      } ${className}`}
    >
      {/* Background fill progress */}
      <div
        className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#008751] to-emerald-500 transition-[width] duration-75 ease-out opacity-90"
        style={{ width: `${Math.min(100, progressPercent + 12)}%` }}
      />

      {/* Shimmering pulse overlay */}
      {!isCompleted && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}

      {/* Centered Track Label */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none z-10 px-6">
        {isCompleted ? (
          <div className="flex items-center justify-between w-full text-white font-bold tracking-wide animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-emerald-700/80 flex items-center justify-center">
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </div>
            <span className="text-base font-black tracking-widest uppercase">{completedLabel}</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="w-7 h-7 rounded-lg bg-emerald-800/60 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
            </div>
            <span
              className="text-sm sm:text-base font-black tracking-widest text-white uppercase transition-opacity duration-150 drop-shadow"
              style={{ opacity: Math.max(0.15, 1 - progressPercent / 60) }}
            >
              AQBASHO
            </span>
            <div
              className="flex items-center text-emerald-200 animate-pulse"
              style={{ opacity: Math.max(0.2, 1 - progressPercent / 60) }}
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        )}
      </div>

      {/* Draggable Emerald Slider Handle */}
      <div
        ref={handleRef}
        id="driver-slide-to-accept-handle"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={`relative z-20 h-13 w-14 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl transition-transform duration-75 select-none ${
          isCompleted
            ? 'bg-white text-[#008751] translate-x-0'
            : 'bg-gradient-to-br from-emerald-400 via-[#008751] to-emerald-700 text-white border-2 border-white/40 shadow-emerald-500/50'
        } ${!isDragging ? 'transition-all duration-300' : ''}`}
        style={{
          transform: `translateX(${sliderPosition}px)`,
        }}
      >
        {isCompleted ? (
          <Check className="w-6 h-6 text-[#008751] stroke-[3]" />
        ) : (
          <div className="flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-white stroke-[2.5] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
