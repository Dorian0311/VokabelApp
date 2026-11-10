import { useCallback, useEffect, useRef } from 'react';

export function useTransitionTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
  return useCallback((callback: () => void, delay: number) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(callback, delay);
  }, []);
}
