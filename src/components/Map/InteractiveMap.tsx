import React from 'react';
import { GoogleInteractiveMap } from './GoogleInteractiveMap';

interface InteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  onModeChange?: (mode: 'pickup' | 'dropoff') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = (props) => {
  return <GoogleInteractiveMap {...props} />;
};
