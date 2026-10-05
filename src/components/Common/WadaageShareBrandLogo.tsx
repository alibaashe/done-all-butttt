import React from 'react';
import { WadaageLogo } from './WadaageLogo';

interface WadaageShareBrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WadaageShareBrandLogo: React.FC<WadaageShareBrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`inline-flex items-center space-x-1.5 select-none ${className}`}>
      <WadaageLogo variant="icon" size={size} appType="rider" />
      <WadaageLogo variant="wordmark" size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'} colorMode="dark" appType="rider" />
    </div>
  );
};
