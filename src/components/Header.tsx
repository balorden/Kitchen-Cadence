import React from 'react';
import { ChefHat, Plus, Upload, Download, RefreshCw, CheckSquare, Calendar, Building2, Kanban } from 'lucide-react';

export type ActiveTab = 'directory' | 'windows' | 'tasks' | 'pipeline';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
  openTaskCount: number;
  inWindowCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenCsvModal,
  openTaskCount,
  inWindowCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-neutral-900 text-white border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark with domain mark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-white shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab('directory')}
            className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors text-left"
          >
            KitchenCadence
          </button>
        </div>

        {/* Zone 2: Clean text navigation links (Top Bar Contract) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'directory'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'windows'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today's Windows</span>
            {inWindowCount > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                {inWindowCount} Open
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Rep Tasks</span>
            {openTaskCount > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded">
                {openTaskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'pipeline'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Pipeline</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCsvModal}
            className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Import or Export CSV list"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV Data</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800 py-1.5 bg-neutral-950 text-xs">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3 py-1 font-medium ${
            activeTab === 'directory' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          Accounts
        </button>
        <button
          onClick={() => setActiveTab('windows')}
          className={`px-3 py-1 font-medium ${
            activeTab === 'windows' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          Windows ({inWindowCount})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1 font-medium ${
            activeTab === 'tasks' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          Tasks ({openTaskCount})
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3 py-1 font-medium ${
            activeTab === 'pipeline' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          Pipeline
        </button>
      </div>
    </header>
  );
};
