import { useEffect } from 'react';

export function useViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const refresh = () => {
      document.documentElement.style.setProperty('--app-height', `${viewport?.height ?? window.innerHeight}px`);
      document.documentElement.style.setProperty('--app-offset-top', `${viewport?.offsetTop ?? 0}px`);
      document.documentElement.classList.toggle('keyboard-open', window.innerHeight - (viewport?.height ?? window.innerHeight) > 150);
    };
    const resize = () => {
      refresh();
      if (document.activeElement instanceof HTMLElement && document.activeElement.matches('input, textarea')) document.activeElement.scrollIntoView({ block: 'nearest' });
    };
    refresh();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', refresh);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', resize);
      document.documentElement.style.removeProperty('--app-height');
      document.documentElement.style.removeProperty('--app-offset-top');
      document.documentElement.classList.remove('keyboard-open');
    };
  }, []);
}
