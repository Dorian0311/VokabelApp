import { useState } from 'react';
import { Zap, Flame, Target, Settings } from 'lucide-react';
import { useClock } from '../../hooks/useClock';
import { getToday } from '../../utils/xp';
import { useStore } from '../../hooks/useStore';
import SettingsModal from './SettingsModal';

export default function Header() {
  const { state } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const now = useClock();
  const { xp, dailyGoal } = state.progress;
  const dailyProgress = state.progress.dailyProgressDate === getToday(new Date(now)) ? state.progress.dailyProgress : 0;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const streak = [getToday(new Date(now)), getToday(yesterday)].includes(state.progress.lastStudyDate) ? state.progress.streak : 0;
  const pct = Math.min((dailyProgress / dailyGoal) * 100, 100);

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 dark:bg-zinc-900/50 bg-white/50 backdrop-blur-sm border-b dark:border-zinc-800/50 border-zinc-200/50">
        <div className="flex items-center gap-1.5 text-indigo-500">
          <Zap size={18} fill="currentColor" />
          <span className="text-sm font-bold">{xp}</span>
          <span className="text-xs dark:text-zinc-500 text-zinc-400">XP</span>
        </div>

        <div className={`flex items-center gap-1.5 text-amber-500 ${streak > 0 ? 'animate-pulse-glow' : ''}`}>
          <Flame size={18} fill={streak > 0 ? 'currentColor' : 'none'} />
          <span className="text-sm font-bold">{streak}</span>
          <span className="text-xs dark:text-zinc-500 text-zinc-400">Tage</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[180px]">
          <Target size={16} className="dark:text-zinc-500 text-zinc-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs dark:text-zinc-400 text-zinc-500">{dailyProgress}/{dailyGoal}</span>
            </div>
            <div className="h-1.5 dark:bg-zinc-800 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors min-h-11 min-w-11 flex items-center justify-center shrink-0"
          title="Einstellungen"
        >
          <Settings size={18} />
        </button>
      </div>

      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
