import React from 'react';
import { GoogleInteractiveMap } from './GoogleInteractiveMap';

interface UnifiedMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
}

export const UnifiedMap: React.FC<UnifiedMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
}) => {
  return (
    <div className="w-full h-full relative">
      <GoogleInteractiveMap
        showSurgeHeatmap={showSurgeHeatmap}
        selectableMode={selectableMode}
        height={height}
      />
    </div>
  );
};
