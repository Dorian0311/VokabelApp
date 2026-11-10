import { useContext } from 'react';
import { StoreContext, type StoreContextType } from './storeContext';

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
