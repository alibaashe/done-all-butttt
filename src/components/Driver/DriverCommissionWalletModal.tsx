import React from 'react';
import { WadaageDriverWalletModal } from './WadaageDriverWalletModal';

interface DriverCommissionWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverCommissionWalletModal: React.FC<DriverCommissionWalletModalProps> = ({ isOpen, onClose }) => {
  return <WadaageDriverWalletModal isOpen={isOpen} onClose={onClose} />;
};
