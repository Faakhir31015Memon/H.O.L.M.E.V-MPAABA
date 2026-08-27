import { useContext } from 'react';
import { HolmevContext } from './holmevContextDef';

export const useHolmev = () => {
  const context = useContext(HolmevContext);
  if (!context) {
    throw new Error('useHolmev must be used within a HolmevProvider');
  }
  return context;
};
