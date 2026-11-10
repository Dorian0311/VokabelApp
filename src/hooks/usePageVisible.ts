import { useSyncExternalStore } from 'react';

function subscribe(refresh: () => void) {
  document.addEventListener('visibilitychange', refresh);
  return () => document.removeEventListener('visibilitychange', refresh);
}
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribe, () => !document.hidden, () => true);
}
