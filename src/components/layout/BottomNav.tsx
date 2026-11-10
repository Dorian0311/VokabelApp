import { motion } from 'framer-motion';
import { LayoutDashboard, Camera, BookOpen, Gamepad2 } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import type { Page } from '../../types';

const tabs: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { page: 'scanner', icon: Camera, label: 'Scanner' },
  { page: 'learn', icon: BookOpen, label: 'Lernen' },
  { page: 'games', icon: Gamepad2, label: 'Spiele' },
];

export default function BottomNav() {
  const { state, setPage } = useStore();

  return (
    <nav data-bottom-nav
      className="fixed bottom-0 inset-x-0 z-40 flex lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex w-full h-16">
        {tabs.map((tab) => {
          const isActive = state.currentPage === tab.page;
          const Icon = tab.icon;

          return (
            <button
              key={tab.page}
              aria-current={isActive ? "page" : undefined} onClick={() => setPage(tab.page)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-11 min-w-11 transition-colors"
            >
              <Icon
                size={22}
                className={
                  isActive
                    ? 'text-indigo-500'
                    : 'text-zinc-600 dark:text-zinc-400'
                }
              />
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-indigo-500'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-indigo-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
