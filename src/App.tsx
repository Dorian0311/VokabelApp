import { lazy, Suspense } from 'react';
import { StoreProvider } from './hooks/StoreProvider';
import { useStore } from './hooks/useStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/dashboard/Dashboard';
import { useViewport } from './hooks/useViewport';
import { downloadJSON } from './utils/download';
import { exportRecoveryData } from './utils/storage';

const Scanner = lazy(() => import('./components/scanner/Scanner'));
const LearnCenter = lazy(() => import('./components/learn/LearnCenter'));
const GameArcade = lazy(() => import('./components/games/GameArcade'));

function AppContent() {
  const { state, storageError } = useStore();
  useViewport();

  return (
    <div className="min-h-dvh min-h-[var(--app-height,100dvh)] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header with XP & Streak */}
        <Header />

        {/* View Switcher */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-24 lg:pb-12">
          {storageError && <div role="alert" className="mb-4 rounded-xl border border-amber-500 p-4 text-amber-900 dark:text-amber-200">
            <p>{storageError}</p>
            <button className="mt-2 min-h-11 underline" onClick={() => { try { downloadJSON(exportRecoveryData(), 'snapvocab-originaldaten.json'); } catch { window.alert('Originaldaten sind derzeit nicht zugänglich. Sichere den aktuellen Stand über Backup exportieren.'); } }}>Originaldaten sichern</button>
          </div>}
          <Suspense fallback={<p role="status">Ansicht wird geladen …</p>}>
            {state.currentPage === 'dashboard' && <Dashboard />}
            {state.currentPage === 'scanner' && <Scanner />}
            {state.currentPage === 'learn' && <LearnCenter />}
            {state.currentPage === 'games' && <GameArcade />}
          </Suspense>
        </main>

        {/* Mobile Bottom Navigation (hidden on desktop) */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
