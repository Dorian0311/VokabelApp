import { useState } from 'react';
import { LayoutDashboard, Camera, BookOpen, Gamepad2, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import type { Page } from '../../types';
import SettingsModal from './SettingsModal';

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'Foto-Scanner', icon: Camera },
  { id: 'learn', label: 'Lern-Center', icon: BookOpen },
  { id: 'games', label: 'Game Arcade', icon: Gamepad2 },
];

export default function Sidebar() {
  const { state, setPage, updateSettings } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 dark:bg-zinc-900 bg-white border-r dark:border-zinc-800 border-zinc-200 z-40">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b dark:border-zinc-800 border-zinc-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10">
            <Sparkles size={20} className="text-indigo-500" />
          </div>
          <span className="text-lg font-bold dark:text-zinc-100 text-zinc-900">SnapVocab</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = state.currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-11 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-500'
                    : 'dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t dark:border-zinc-800 border-zinc-200 flex flex-col gap-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-all min-h-11"
          >
            <Settings size={20} />
            Einstellungen
          </button>
          <button
            onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-all min-h-11"
          >
            {state.settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {state.settings.darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
