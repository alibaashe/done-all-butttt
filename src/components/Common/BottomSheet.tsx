import React, { useState, useRef, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // e.g. [0.4, 0.85] fraction of window height
  initialSnap?: number;
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  pulsingBorder?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  showBackdrop = true,
  closeOnBackdropClick = true,
  pulsingBorder = false,
  headerContent,
  className = '',
}) => {
  const [currentSnapIndex, setCurrentSnapIndex] = useState<number>(initialSnap);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnap);
      setDragOffset(0);
    }
  }, [isOpen, initialSnap]);

  if (!isOpen) return null;

  const currentSnapFraction = snapPoints[currentSnapIndex] || 0.6;
  const sheetHeightPercent = Math.min(95, Math.max(25, currentSnapFraction * 100));

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    // Prevent dragging too far up
    if (deltaY < -60) {
      setDragOffset(-60);
    } else {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If dragged down significantly, close or reduce snap
    if (dragOffset > 100) {
      if (currentSnapIndex > 0) {
        setCurrentSnapIndex(currentSnapIndex - 1);
        setDragOffset(0);
      } else if (onClose) {
        onClose();
      } else {
        setDragOffset(0);
      }
    } else if (dragOffset < -60 && currentSnapIndex < snapPoints.length - 1) {
      // Expand to next snap point
      setCurrentSnapIndex(currentSnapIndex + 1);
      setDragOffset(0);
    } else {
      // Snap back
      setDragOffset(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none pointer-events-none">
      {/* Backdrop */}
      {showBackdrop && (
        <div
          id="bottom-sheet-backdrop"
          onClick={closeOnBackdropClick ? onClose : undefined}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto animate-fade-in"
        />
      )}

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        id="bottom-sheet-container"
        style={{
          maxHeight: `${sheetHeightPercent}vh`,
          transform: `translateY(${Math.max(0, dragOffset)}px)`,
        }}
        className={`relative w-full max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto transition-transform duration-200 ease-out border-t ${
          pulsingBorder
            ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20 animate-pulse'
            : 'border-slate-200/80 dark:border-slate-800'
        } ${className}`}
      >
        {/* Grab Handle Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-colors" />
          {headerContent && <div className="w-full mt-2">{headerContent}</div>}
        </div>

        {/* Sheet Content with Smooth Scroll */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1 space-y-3 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
